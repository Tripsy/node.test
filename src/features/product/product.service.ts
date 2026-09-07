import {
	type DeepPartial,
	type EntityManager,
	In,
	QueryFailedError,
} from 'typeorm';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/message.setup';
import {
	resolveTargetImages,
	type TargetImage,
	TargetImageTypeEnum,
} from '@/config/target-image.config';
import { CustomError } from '@/exceptions';
import CategoryEntity from '@/features/category/category.entity';
import ProductEntity, {
	type ProductComposition,
	ProductCompositionEnum,
	type ProductSaleStatus,
	ProductSaleStatusEnum,
	ProductTypeEnum,
	ProductUnitEnum,
	type ProductWorkflow,
	UNITS_BY_TYPE,
	WORKFLOW_TRANSITIONS,
} from '@/features/product/product.entity';
import { getProductRepository } from '@/features/product/product.repository';
import type {
	ProductAttributeType,
	ProductBundleItemType,
	ProductValidator,
} from '@/features/product/product.validator';
import ProductAttributeRepository, {
	type ResolvedAttributeValue,
} from '@/features/product/product-attribute.repository';
import ProductAvailabilityEntity from '@/features/product/product-availability.entity';
import ProductAvailabilityRepository from '@/features/product/product-availability.repository';
import ProductBundleRepository from '@/features/product/product-bundle.repository';
import ProductBundleItemEntity from '@/features/product/product-bundle-item.entity';
import ProductCategoryRepository from '@/features/product/product-category.repository';
import type ProductCategoryAttributeEntity from '@/features/product/product-category-attribute.entity';
import {
	ProductCategoryAttributeScopeEnum,
	ProductCategoryAttributeValueTypeEnum,
} from '@/features/product/product-category-attribute.entity';
import {
	attributeLabelName,
	productCategoryAttributeService,
} from '@/features/product/product-category-attribute.service';
import { SLUG_UNIQUE_INDEX } from '@/features/product/product-content.entity';
import ProductContentRepository from '@/features/product/product-content.repository';
import ProductOptionRepository from '@/features/product/product-option.repository';
import ProductOptionGroupEntity from '@/features/product/product-option-group.entity';
import ProductTagRepository from '@/features/product/product-tag.repository';
import ProductVariantEntity from '@/features/product/product-variant.entity';
import ProductVariantRepository, {
	type ResolvedVariant,
} from '@/features/product/product-variant.repository';
import { pickValuesFromObject } from '@/helpers/objects.helper';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import {
	assertValidStatusTransition,
	cleanEntityCache,
} from '@/shared/abstracts/service.abstract';
import { toBaseUnit } from '@/shared/types/measure-unit.type';
import type { ValidatorOutput } from '@/shared/types/mock.type';

/**
 * Columns owned by the product row itself — everything else lives in a child table
 * (`product_content`, `product_variant`, `product_attribute`, and the option and bundle trees).
 */
const entryColumns: string[] = [
	'type',
	'composition',
	'unit',
	'vat_category',
	'available_from',
	'available_until',
	'discontinued_at',
	'brand_id',
];

const slugConflictError = (): CustomError =>
	new CustomError(409, lang('product.error.slug_already_exists'));

/** The picture a listing shows for a product: the first of its gallery, by `sort_order`. */
export type ProductCoverImageType = TargetImage;

export type WithCoverImage<T> = T & {
	cover_image: ProductCoverImageType | null;
};

/** How many units a bundle has to add up to before it is a bundle rather than a product. */
const BUNDLE_MINIMUM_UNITS = 2;

export class ProductService {
	constructor(private repository: ReturnType<typeof getProductRepository>) {}

	/**
	 * Both slug checks read outside the transaction that writes the content, so two concurrent
	 * requests can find the same slug free and only the second meets the `(slug, language)`
	 * unique index. Postgres answers that with a bare unique violation, which the error handler
	 * would mask as a 500 — mapped back onto the same 409 the pre-check raises so the race and
	 * the ordinary case read alike.
	 *
	 * The variant code indexes are handled here too, and separately: a SKU and a barcode are
	 * different things a warehouse speaks, so "this code is taken" has to name which one.
	 */
	private async withConflictGuard<T>(
		operation: () => Promise<T>,
	): Promise<T> {
		try {
			return await operation();
		} catch (error) {
			if (
				!RepositoryAbstract.isUniqueViolation(error) ||
				!(error instanceof QueryFailedError)
			) {
				throw error;
			}

			switch (error.driverError?.constraint) {
				case SLUG_UNIQUE_INDEX:
					throw slugConflictError();
				case 'IDX_product_variant_sku':
					throw new CustomError(
						409,
						lang('product.error.variant_sku_already_exists'),
					);
				case 'IDX_product_variant_barcode':
					throw new CustomError(
						409,
						lang('product.error.barcode_already_exists'),
					);
				default:
					throw error;
			}
		}
	}

	/**
	 * `sale_status` is derived, never stated: the timestamps are what an editor edits and this
	 * is only their projection, which is why the column carries no transition map.
	 *
	 * Applied on every write as well as by the recompute cron. The cron is what moves a product as
	 * time passes; without this, a product created with a future `available_from` would be
	 * listed as sellable until the next pass.
	 */
	private resolveSaleStatus(entry: {
		available_from: Date | null;
		available_until: Date | null;
		discontinued_at: Date | null;
	}): ProductSaleStatus {
		const now = new Date();

		if (entry.discontinued_at && entry.discontinued_at <= now) {
			return ProductSaleStatusEnum.DISCONTINUED;
		}

		if (entry.available_from && entry.available_from > now) {
			return ProductSaleStatusEnum.COMING_SOON;
		}

		if (entry.available_until && entry.available_until <= now) {
			return ProductSaleStatusEnum.UNAVAILABLE;
		}

		return ProductSaleStatusEnum.AVAILABLE;
	}

	/**
	 * The catalog window on the row as it will be saved.
	 *
	 * The validator rejects a payload carrying both dates inverted, but it only sees the
	 * payload: an update that moves `available_until` alone is compared against nothing there.
	 * This runs after the merge, where both values are known.
	 */
	private assertAvailabilityWindow(entry: ProductEntity): void {
		if (!entry.available_from || !entry.available_until) {
			return;
		}

		if (entry.available_until > entry.available_from) {
			return;
		}

		throw new CustomError(
			422,
			lang('product.validation.available_until_before_from'),
		);
	}

	/**
	 * The type/unit pairing on the row as it will be saved.
	 *
	 * Not a validator rule for the same reason as the availability window above: `type` and
	 * `unit` are each independently updatable, so a payload moving one alone has nothing to
	 * compare against. This runs after the merge, where both values are known.
	 */
	private assertUnitForType(entry: ProductEntity): void {
		if (UNITS_BY_TYPE[entry.type].includes(entry.unit)) {
			return;
		}

		throw new CustomError(
			422,
			lang('product.validation.invalid_unit_for_type', {
				type: entry.type,
				unit: entry.unit,
			}),
		);
	}

	public async create(
		data: ValidatorOutput<ProductValidator, 'create'>,
	): Promise<ProductEntity> {
		const conflict = await ProductContentRepository.findConflictingSlug(
			data.contents,
		);

		if (conflict) {
			throw slugConflictError();
		}

		return this.withConflictGuard(() =>
			dataSource.transaction(async (manager) => {
				const repository = manager.getRepository(ProductEntity);

				/*
				 * `type` and `unit` carry their column defaults explicitly because
				 * `repository.create()` does not apply them and `assertUnitForType` below
				 * reads both before the insert — an omitted `type` would index
				 * `UNITS_BY_TYPE` with `undefined`. The other defaulted columns are only
				 * read after `save`, which back-fills them through `RETURNING`.
				 */
				const entry = repository.create({
					type: data.type ?? ProductTypeEnum.PHYSICAL,
					composition: data.composition,
					unit: data.unit ?? ProductUnitEnum.PIECE,
					vat_category: data.vat_category,
					available_from: data.available_from,
					available_until: data.available_until,
					discontinued_at: data.discontinued_at,
					brand_id: data.brand_id,
				});

				this.assertAvailabilityWindow(entry);
				this.assertUnitForType(entry);

				entry.sale_status = this.resolveSaleStatus(entry);

				const saved = await repository.save(entry);

				await this.saveRelations(manager, saved, data, data.categories);

				return saved;
			}),
		);
	}

	/**
	 * @description Update any data
	 */
	public async update(
		data: DeepPartial<ProductEntity> & { id: number },
	): Promise<ProductEntity> {
		const saved = await this.repository.save(data);

		await cleanEntityCache(ProductEntity, saved.id);

		return saved;
	}

	public async updateDataWithContent(
		entry: ProductEntity,
		data: ValidatorOutput<ProductValidator, 'update'>,
	): Promise<ProductEntity> {
		if (data.contents?.length) {
			const conflict = await ProductContentRepository.findConflictingSlug(
				data.contents,
				entry.id,
			);

			if (conflict) {
				throw slugConflictError();
			}
		}

		/*
		 * The attribute definitions are resolved from the product's categories, so a payload
		 * that omits the links has to be checked against the ones already stored — otherwise
		 * an edit that only changes an attribute would be validated against no schema at all.
		 */
		const categoryIds =
			data.categories ?? (await this.loadCategoryIds(entry.id));

		const updatedEntry = await this.withConflictGuard(() =>
			dataSource.transaction(async (manager) => {
				const repository = manager.getRepository(ProductEntity);

				Object.assign(entry, pickValuesFromObject(data, entryColumns));

				this.assertAvailabilityWindow(entry);
				this.assertUnitForType(entry);

				entry.sale_status = this.resolveSaleStatus(entry);

				const saved = await repository.save(entry);

				await this.saveRelations(manager, saved, data, categoryIds);

				return saved;
			}),
		);

		/*
		 * One clean for the whole operation, emitted after the transaction commits. The child
		 * rows written above carry no subscribers of their own: a row-level hook fires once per
		 * row — a product with four variants and twelve prices meant sixteen identical Redis
		 * SCANs — and it fires *inside* the transaction, where a concurrent reader can refill
		 * the cache from a snapshot about to be superseded.
		 */
		await cleanEntityCache(ProductEntity, updatedEntry.id);

		return updatedEntry;
	}

	private async loadCategoryIds(product_id: number): Promise<number[]> {
		const links = await ProductCategoryRepository.createQuery()
			.select(['product_category.category_id'])
			.filterBy('product_category.product_id', product_id)
			.all();

		return links.map((link) => link.category_id);
	}

	/**
	 * Every child table, in an order the foreign keys allow: the bundle tree names variants, so
	 * the variants of this product have to exist before it is written.
	 *
	 * An absent key means "leave alone" and an empty array means "clear" — the same contract
	 * the article feature uses, and the reason a partial update can touch one branch of a
	 * product without restating the rest of it.
	 */
	private async saveRelations(
		manager: EntityManager,
		entry: ProductEntity,
		data: Partial<ValidatorOutput<ProductValidator, 'create'>>,
		categoryIds: number[],
	): Promise<void> {
		await ProductContentRepository.saveContent(
			manager,
			data.contents ?? [],
			entry.id,
		);

		if (data.categories) {
			await ProductCategoryRepository.syncLinks(
				manager,
				entry.id,
				data.categories,
			);
		}

		if (data.tags) {
			await ProductTagRepository.syncLinks(manager, entry.id, data.tags);
		}

		if (data.variants) {
			await ProductVariantRepository.syncVariants(
				manager,
				entry.id,
				await this.resolveVariants(
					data.variants,
					categoryIds,
					entry.composition,
				),
			);
		}

		if (data.attributes) {
			await ProductAttributeRepository.syncValues(
				manager,
				entry.id,
				await this.resolveAttributeValues(
					data.attributes,
					categoryIds,
					ProductCategoryAttributeScopeEnum.PRODUCT,
				),
			);
		}

		if (data.availabilities) {
			await ProductAvailabilityRepository.syncWindows(
				manager,
				entry.id,
				data.availabilities,
			);
		}

		if (data.option_groups) {
			await ProductOptionRepository.syncGroups(
				manager,
				entry.id,
				data.option_groups,
			);
		}

		await this.saveComposition(manager, entry, data);
	}

	/**
	 * The bundle tree, plus the two rules the schema cannot hold.
	 *
	 * A `simple` product has its components cleared rather than left in place: switching the
	 * composition back is how a bundle is unmade, and rows nothing reads still name variants
	 * whose delete they would then block through the RESTRICT foreign key.
	 */
	private async saveComposition(
		manager: EntityManager,
		entry: ProductEntity,
		data: Partial<ValidatorOutput<ProductValidator, 'create'>>,
	): Promise<void> {
		if (entry.composition === ProductCompositionEnum.SIMPLE) {
			await ProductBundleRepository.syncItems(manager, entry.id, []);

			return;
		}

		const items = data.bundle_items;

		await this.assertComponents(manager, entry, items ?? []);

		if (items) {
			await ProductBundleRepository.syncItems(manager, entry.id, items);
		}

		await this.assertBundleIsComposed(manager, entry.id);
	}

	/**
	 * No nested bundles, and no bundle that contains itself.
	 *
	 * A component pointing at another bundle's variant creates a cycle no constraint can detect:
	 * the order line explodes a bundle into one child per component, and a child that is itself
	 * a bundle would have to explode again, with nothing to stop it. Rejected at the write
	 * instead, which is the only place the whole graph is in reach.
	 */
	private async assertComponents(
		manager: EntityManager,
		entry: ProductEntity,
		items: ProductBundleItemType[],
	): Promise<void> {
		if (items.length === 0) {
			return;
		}

		const variantIds = Array.from(
			new Set(items.map((item) => item.variant_id)),
		);

		const variants = await manager
			.getRepository(ProductVariantEntity)
			.find({
				where: { id: In(variantIds) },
				relations: { product: true },
			});

		if (variants.length !== variantIds.length) {
			throw new CustomError(
				422,
				lang('product.validation.invalid_bundle_item'),
			);
		}

		for (const variant of variants) {
			if (variant.product_id === entry.id) {
				throw new CustomError(
					422,
					lang('product.error.bundle_self_reference'),
				);
			}

			if (
				variant.product?.composition === ProductCompositionEnum.BUNDLE
			) {
				throw new CustomError(422, lang('product.error.bundle_nested'));
			}
		}
	}

	/**
	 * A bundle has to be more than one thing, or it is a product wearing a bundle's clothes.
	 *
	 * Counted in units a customer ends up with rather than in components, so a single component
	 * with `quantity: 2` — a two-pack — qualifies where the same component alone does not.
	 *
	 * Read back from the rows just written instead of from the payload: an update is partial,
	 * so a payload that omits `bundle_items` leaves the existing components in place and only
	 * the table knows what the bundle now holds.
	 */
	private async assertBundleIsComposed(
		manager: EntityManager,
		product_id: number,
	): Promise<void> {
		const includedUnits = await manager
			.getRepository(ProductBundleItemEntity)
			.createQueryBuilder('item')
			.select('COALESCE(SUM(item.quantity), 0)', 'total')
			.where('item.product_id = :product_id', { product_id })
			.getRawOne<{ total: string }>();

		if (Number(includedUnits?.total ?? 0) < BUNDLE_MINIMUM_UNITS) {
			throw new CustomError(
				422,
				lang('product.validation.bundle_composition_too_small'),
			);
		}
	}

	/**
	 * Turns payload variants into rows the repository can write, by resolving each axis value
	 * against the `variant`-scoped definitions of the product's categories.
	 */
	private async resolveVariants(
		variants: ValidatorOutput<ProductValidator, 'create'>['variants'],
		categoryIds: number[],
		composition: ProductComposition,
	): Promise<ResolvedVariant[]> {
		const definitions =
			await productCategoryAttributeService.resolveDefinitionsByLabel(
				categoryIds,
				ProductCategoryAttributeScopeEnum.VARIANT,
				{ assertScopeAgreement: true },
			);

		/*
		 * A bundle carries exactly one variant, the header line its components hang off, and it
		 * has no siblings — so an axis meant to tell siblings apart has nothing to distinguish
		 * and is not asked for. Values still resolve if a caller sends any; only the demand for
		 * the required ones is lifted, which would otherwise make a bundle unsavable in any
		 * category declaring one, with nothing an editor could supply.
		 */
		const isBundle = composition === ProductCompositionEnum.BUNDLE;

		return variants.map((variant) => {
			/*
			 * Per variant, not per product: a required axis is what tells siblings apart, so
			 * every one of them has to state it or the set is ambiguous.
			 */
			if (!isBundle) {
				this.assertRequiredSupplied(definitions, variant.attributes);
			}

			return {
				...variant,
				attributes: variant.attributes?.map((value) =>
					this.resolveAttributeValue(value, definitions),
				),
			};
		});
	}

	/**
	 * Every definition marked `is_required` has to come back with a value.
	 *
	 * The row-level checks in `resolveAttributeValue` can only judge the values a payload *does*
	 * carry; a required attribute the caller simply left out has no row for them to see. So the
	 * set is checked against the definitions it was resolved from, which is also the only place
	 * that knows which of them were required.
	 *
	 * Named by its label rather than its id — the message reaches an editor, and the first
	 * translation the term carries is the closest thing to a name available here.
	 */
	private assertRequiredSupplied(
		definitions: Map<number, ProductCategoryAttributeEntity>,
		values: ProductAttributeType[] | undefined,
	): void {
		const supplied = new Set(
			(values ?? []).map((value) => value.attribute_label_id),
		);

		for (const [labelId, definition] of definitions) {
			if (!definition.is_required || supplied.has(labelId)) {
				continue;
			}

			throw new CustomError(
				422,
				lang('product.error.attribute_required', {
					attribute: attributeLabelName(definition),
				}),
			);
		}
	}

	private async resolveAttributeValues(
		values: ProductAttributeType[],
		categoryIds: number[],
		scope: typeof ProductCategoryAttributeScopeEnum.PRODUCT,
	): Promise<ResolvedAttributeValue[]> {
		const definitions =
			await productCategoryAttributeService.resolveDefinitionsByLabel(
				categoryIds,
				scope,
				{ assertScopeAgreement: true },
			);

		this.assertRequiredSupplied(definitions, values);

		return values.map((value) =>
			this.resolveAttributeValue(value, definitions),
		);
	}

	/**
	 * One recorded value, checked against the definition that governs its label and normalized.
	 *
	 * Three things happen here and nowhere else:
	 *
	 * - the label has to be one the product's categories declare, so a value cannot be recorded
	 *   against a form field that was never offered;
	 * - a term-backed value has to be on the definition's option list, which spans three tables
	 *   and is the second half of the invariant `product_category_attribute_option` cannot hold;
	 * - `value_base` is produced by `toBaseUnit`, once, on write — converting at read time would
	 *   put arithmetic between a range filter and its index.
	 */
	private resolveAttributeValue(
		value: ProductAttributeType,
		definitions: Map<number, ProductCategoryAttributeEntity>,
	): ResolvedAttributeValue {
		const definition = definitions.get(value.attribute_label_id);

		if (!definition) {
			throw new CustomError(
				422,
				lang('product.error.attribute_not_declared'),
			);
		}

		const expected = {
			[ProductCategoryAttributeValueTypeEnum.TERM]: value.value_term_id,
			[ProductCategoryAttributeValueTypeEnum.NUMBER]: value.value_numeric,
			[ProductCategoryAttributeValueTypeEnum.STRING]: value.value_text,
			[ProductCategoryAttributeValueTypeEnum.BOOLEAN]:
				value.value_boolean,
		}[definition.value_type];

		if (expected === undefined || expected === null) {
			throw new CustomError(
				422,
				lang('product.error.attribute_value_type_mismatch'),
			);
		}

		if (
			definition.value_type === ProductCategoryAttributeValueTypeEnum.TERM
		) {
			const admissible = (definition.options ?? []).map(
				(option) => option.term_id,
			);

			if (!admissible.includes(value.value_term_id as number)) {
				throw new CustomError(
					422,
					lang('product.error.attribute_value_not_admissible'),
				);
			}

			return { ...value, value_base: null };
		}

		if (
			definition.value_type !==
			ProductCategoryAttributeValueTypeEnum.NUMBER
		) {
			return { ...value, value_base: null };
		}

		const numeric = value.value_numeric as number;

		// The bounds are quoted in the definition's own unit, like the value they bound, so
		// they are compared before the conversion rather than after it
		if (
			(definition.min_value !== null && numeric < definition.min_value) ||
			(definition.max_value !== null && numeric > definition.max_value)
		) {
			throw new CustomError(
				422,
				lang('product.error.attribute_value_out_of_range'),
			);
		}

		return {
			...value,
			value_base: toBaseUnit(numeric, definition.unit),
		};
	}

	public async updateWorkflow(
		entry: ProductEntity,
		workflow: ProductWorkflow,
	): Promise<void> {
		assertValidStatusTransition(
			WORKFLOW_TRANSITIONS,
			entry.workflow,
			workflow,
		);

		entry.workflow = workflow;

		await this.update(entry);
	}

	/**
	 * Moves a product onto the `sale_status` its timestamps imply. Called by the recompute cron for
	 * rows whose deadline has passed since the last pass; the write paths compute the same value
	 * inline, so this only ever finds products time has moved.
	 *
	 * Returns whether anything changed, so the cron can report a count rather than a pass.
	 */
	public async recomputeSaleStatus(entry: ProductEntity): Promise<boolean> {
		const resolved = this.resolveSaleStatus(entry);

		if (resolved === entry.sale_status) {
			return false;
		}

		entry.sale_status = resolved;

		await this.update(entry);

		return true;
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<ProductEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	/**
	 * The category and every category beneath it, as ids.
	 *
	 * Every `category_id` filter resolves through here — this service's listings, the storefront's,
	 * and `ProductVariantService`'s — so "in this category" means the same thing to all of them: a
	 * catalog tree is three levels deep and a shopper filtering on the top one expects the whole
	 * branch. Public for that last caller, which sits in a sibling module of the same feature.
	 */
	public async resolveCategorySubtree(
		category_id: number,
	): Promise<number[]> {
		const treeRepository =
			RepositoryAbstract.getTreeRepository(CategoryEntity);

		const category = await treeRepository.findOneOrFail({
			where: { id: category_id },
		});

		const descendants = await treeRepository.findDescendants(category);

		return descendants.map((descendant) => descendant.id);
	}

	/**
	 * The child branches of a product, read one query per branch.
	 *
	 * Not joined onto the main query: variants, option groups, bundle components, availabilities
	 * and attributes are five independent to-many relations, and joining them together
	 * multiplies into their product — four variants against three option groups against six
	 * attributes is seventy-two rows for one product, every column repeated in each.
	 */
	private async attachBranches(
		entry: ProductEntity,
		options: { withDeleted: boolean },
	): Promise<ProductEntity> {
		const product_id = entry.id;
		const withDeleted = options.withDeleted;

		const [
			variants,
			attributes,
			availabilities,
			optionGroups,
			bundleItems,
		] = await Promise.all([
			dataSource.getRepository(ProductVariantEntity).find({
				where: { product_id },
				relations: { prices: true, attributes: true },
				order: { position: 'ASC', id: 'ASC' },
				withDeleted,
			}),
			ProductAttributeRepository.find({
				where: { product_id },
				withDeleted,
			}),
			dataSource.getRepository(ProductAvailabilityEntity).find({
				where: { product_id },
				order: { day_of_week: 'ASC', starts_at: 'ASC' },
			}),
			/*
			 * The wording comes with the ids on both levels, the way `findForCategories` brings
			 * it behind `resolve`: a group and its answers are `term` references and nothing
			 * else, so an editor handed the ids alone has a control it cannot draw and no way
			 * to resolve them but one request per row.
			 *
			 * Every translation, not the request's own — the dashboard edits a product under
			 * all of them at once and picks per language at render time.
			 *
			 * `options` is ordered explicitly. Insertion order matches `position` only until a
			 * group is reordered, after which the editor would draw the answers shuffled and
			 * then re-stamp `position` from what it drew.
			 */
			dataSource.getRepository(ProductOptionGroupEntity).find({
				where: { product_id },
				relations: {
					label: { contents: true },
					options: { label: { contents: true }, prices: true },
				},
				order: {
					position: 'ASC',
					id: 'ASC',
					options: {
						position: 'ASC',
						id: 'ASC',
						// The deltas have no position of their own, so a market is named by its
						// code — an unordered read hands a multi-market answer back in a
						// different order each time, and the editor redraws its rows to match.
						prices: { currency: 'ASC' },
					},
				},
			}),
			dataSource.getRepository(ProductBundleItemEntity).find({
				where: { product_id },
				order: { position: 'ASC', id: 'ASC' },
			}),
		]);

		entry.variants = variants;
		entry.attributes = attributes;
		entry.availabilities = availabilities;
		entry.option_groups = optionGroups;
		entry.bundle_items = bundleItems;

		return entry;
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 *
	 * An omitted `language` means every translation, not the request's own — the dashboard edits
	 * all of them at once and has no other way to ask for them.
	 */
	public async getEntryData(data: {
		id: number;
		language?: string;
		withDeleted: boolean;
	}) {
		const query = this.repository
			.createQuery()
			.select([
				'product.id',
				'product.workflow',
				'product.sale_status',
				'product.type',
				'product.composition',
				'product.unit',
				'product.vat_category',
				'product.available_from',
				'product.available_until',
				'product.discontinued_at',
				'product.details',
				'product.brand_id',
				'product.created_at',
				'product.updated_at',
				'product.deleted_at',

				'content.language',
				'content.slug',
				'content.label',
				'content.description',
				'content.meta',

				'brand.id',
				'brand.name',

				'category.category_id',
				'tag.tag_id',

				// The wording behind each link, so a form seeded from this row shows names
				// rather than the bare ids it stores
				'category_row.id',
				'category_content.id',
				'category_content.language',
				'category_content.label',

				'tag_row.id',
				'tag_content.id',
				'tag_content.language',
				'tag_content.value',
			])
			.filterById(data.id)
			.withDeleted(data.withDeleted)
			.joinAndSelect('product.brand', 'brand', 'LEFT')
			/*
			 * The link joins are pinned to live rows by hand because `withDeleted` reaches
			 * them too: it exists so an admin can read a soft-deleted *product*, but TypeORM
			 * applies it to every joined relation, which brings back links unlinked in earlier
			 * edits. The form seeds itself from these rows, so a resurrected link reads as a
			 * removal that did not save.
			 */
			.joinAndSelect(
				'product.categories',
				'category',
				'LEFT',
				'category.deleted_at IS NULL',
			)
			.joinAndSelect(
				'product.tags',
				'tag',
				'LEFT',
				'tag.deleted_at IS NULL',
			)
			.join('category.category', 'category_row', 'LEFT')
			.join('tag.tag', 'tag_row', 'LEFT');

		if (data.language) {
			query
				.joinAndSelect(
					'product.contents',
					'content',
					'INNER',
					'content.language = :language',
					{ language: data.language },
				)
				.join(
					'category_row.contents',
					'category_content',
					'LEFT',
					'category_content.language = :language',
				)
				.join(
					'tag_row.contents',
					'tag_content',
					'LEFT',
					'tag_content.language = :language',
				);
		} else {
			query
				.joinAndSelect('product.contents', 'content', 'LEFT')
				.join('category_row.contents', 'category_content', 'LEFT')
				.join('tag_row.contents', 'tag_content', 'LEFT');
		}

		const entry = await query.firstOrFail();

		return this.attachBranches(entry, { withDeleted: data.withDeleted });
	}

	/**
	 * @description Used in `publicRead` from controller — the anonymous surface.
	 *
	 * Keyed on the content slug, which is the whole public address (`/products/<slug>`) — the
	 * category a product is filed under does not appear in it. Only the sellable
	 * window is reachable, so a draft or a withdrawn product answers 404 to a visitor rather
	 * than leaking its existence through a different status code.
	 */
	public resolvePublicRef(
		slug: string,
		language: string,
	): Promise<ProductEntity> {
		return this.repository
			.createQuery()
			.select(['product.id'])
			.join(
				'product.contents',
				'content',
				'INNER',
				'content.language = :language AND content.slug = :slug',
				{ language, slug },
			)
			.filterBySellable(true)
			.firstOrFail();
	}

	/**
	 * Attaches each product's cover image, when the deployment has something to answer with.
	 *
	 * Asked of the registry in `target-image.config.ts` rather than of the `image` feature,
	 * which is optional here. With no provider registered — a deployment without `image`, or the
	 * `test` environment, where bootstrap does not run — every product answers `null`. The key
	 * stays present either way: a client must not have to tell "no image" apart from "no image
	 * feature".
	 */
	private async attachCoverImages<T extends { id: number }>(
		entries: T[],
	): Promise<WithCoverImage<T>[]> {
		if (entries.length === 0) {
			return [];
		}

		const covers = await resolveTargetImages(
			ProductEntity.NAME,
			TargetImageTypeEnum.GALLERY,
			entries.map((entry) => entry.id),
		);

		return entries.map((entry) => ({
			...entry,
			cover_image: covers.get(entry.id) ?? null,
		}));
	}

	/**
	 * @description Used in `publicRead` from controller, behind the cache.
	 *
	 * Keyed by id rather than slug on purpose: `cleanEntityCache` invalidates by the
	 * `<entity>:<id>*` prefix, so a slug-keyed entry would survive an edit until its TTL.
	 * Resolving the slug first (`resolvePublicRef`) also keeps the sellable window out of the
	 * cached value, which moves without the payload changing.
	 */
	public async getPublicEntryById(id: number, language: string) {
		const entry = await this.repository
			.createQuery()
			.select([
				'product.id',
				'product.sale_status',
				'product.type',
				'product.composition',
				'product.unit',
				'product.vat_category',
				'product.available_from',
				'product.available_until',
				'product.created_at',
				'product.updated_at',

				'content.language',
				'content.slug',
				'content.label',
				'content.description',
				'content.meta',

				'brand.id',
				'brand.name',

				'category.category_id',
				'category_row.id',
				'category_content.id',
				'category_content.language',
				'category_content.label',
				'category_content.slug',

				'tag.tag_id',
				'tag_row.id',
				'tag_content.id',
				'tag_content.language',
				'tag_content.value',
			])
			.filterById(id)
			.joinAndSelect(
				'product.contents',
				'content',
				'INNER',
				'content.language = :language',
				{ language },
			)
			.joinAndSelect('product.brand', 'brand', 'LEFT')
			.joinAndSelect('product.categories', 'category', 'LEFT')
			.joinAndSelect('category.category', 'category_row', 'LEFT')
			.joinAndSelect(
				'category_row.contents',
				'category_content',
				'LEFT',
				'category_content.language = :language',
			)
			.joinAndSelect('product.tags', 'tag', 'LEFT')
			.joinAndSelect('tag.tag', 'tag_row', 'LEFT')
			.joinAndSelect(
				'tag_row.contents',
				'tag_content',
				'LEFT',
				'tag_content.language = :language',
			)
			.firstOrFail();

		await this.attachBranches(entry, { withDeleted: false });

		const [entryWithCover] = await this.attachCoverImages([entry]);

		return entryWithCover;
	}

	/**
	 * The catalog listing.
	 *
	 * Facets are one indexed subquery per facet, `INTERSECT`ed. A single `OR`-of-`AND`s cannot
	 * use a composite index leading on the label and degrades to a sequential scan — see
	 * `.claude/rules/product.md` §12.7. Ranges compare `value_base`, which is why the payload's
	 * figures are converted through the definition's unit first.
	 */
	private async applyFacets(
		query: ReturnType<
			ReturnType<typeof getProductRepository>['createQuery']
		>,
		facets: ValidatorOutput<
			ProductValidator,
			'publicFind'
		>['filter']['attribute'],
		categoryIds: number[],
	): Promise<void> {
		if (!facets?.length) {
			return;
		}

		const definitions =
			await productCategoryAttributeService.resolveDefinitionsByLabel(
				categoryIds,
				ProductCategoryAttributeScopeEnum.PRODUCT,
			);

		facets.forEach((facet, index) => {
			const definition = definitions.get(facet.label_id);
			const unit = definition?.unit ?? null;

			const conditions = [
				`facet_value_${index}.attribute_label_id = :facetLabel${index}`,
				`facet_value_${index}.deleted_at IS NULL`,
			];

			const parameters: Record<string, number | number[]> = {
				[`facetLabel${index}`]: facet.label_id,
			};

			if (facet.value_term_id) {
				conditions.push(
					`facet_value_${index}.value_term_id = ANY(:facetTerms${index})`,
				);
				parameters[`facetTerms${index}`] = [...facet.value_term_id];
			}

			if (facet.min !== undefined && facet.min !== null) {
				conditions.push(
					`facet_value_${index}.value_base >= :facetMin${index}`,
				);
				parameters[`facetMin${index}`] = toBaseUnit(facet.min, unit);
			}

			if (facet.max !== undefined && facet.max !== null) {
				conditions.push(
					`facet_value_${index}.value_base <= :facetMax${index}`,
				);
				parameters[`facetMax${index}`] = toBaseUnit(facet.max, unit);
			}

			query.filterRaw(
				`product.id IN (
					SELECT facet_value_${index}.product_id
					FROM product_attribute facet_value_${index}
					WHERE ${conditions.join(' AND ')}
				)`,
				parameters,
			);
		});
	}

	public async findByFilterPublic(
		data: ValidatorOutput<ProductValidator, 'publicFind'>,
	) {
		const query = this.repository
			.createQuery()
			.join(
				'product.contents',
				'content',
				'INNER',
				'content.language = :language',
				{ language: data.filter.language },
			)
			.join('product.brand', 'brand', 'LEFT')
			/*
			 * The listing names each product's categories, which live two relations away
			 * (link row -> category -> translation) and are what its public URL is built
			 * from. The link is to-many, so these joins multiply the raw rows; pagination
			 * survives it because `getManyAndCount` with skip/take resolves the page as a
			 * distinct-id subquery first. The primary keys are selected for the same reason —
			 * without them TypeORM cannot tell the duplicated rows apart.
			 */
			.join(
				'product.categories',
				'product_category',
				'LEFT',
				'product_category.deleted_at IS NULL',
			)
			.join('product_category.category', 'category', 'LEFT')
			.join(
				'category.contents',
				'category_content',
				'LEFT',
				'category_content.language = :language',
			)
			/*
			 * The default variant and its price in the requested currency: a listing card
			 * shows a price, and resolving it per row afterward would be one query each.
			 */
			.join(
				'product.variants',
				'variant',
				'LEFT',
				'variant.is_default = true AND variant.deleted_at IS NULL',
			)
			.join('variant.prices', 'price', 'LEFT', 'price.deleted_at IS NULL')
			.select([
				'product.id',
				'product.type',
				'product.composition',
				'product.unit',
				'product.vat_category',
				'product.created_at',

				'content.language',
				'content.slug',
				'content.label',
				'content.meta',

				'brand.id',
				'brand.name',

				'product_category.id',
				'product_category.category_id',
				'category.id',
				'category_content.id',
				'category_content.language',
				'category_content.label',
				'category_content.slug',

				'variant.id',
				'variant.sku',
				'price.id',
				'price.currency',
				'price.sale_price',
				'price.reference_price',
			])
			.filterBy('product.id', data.filter.id)
			.filterBy('product.brand_id', data.filter.brand_id)
			.filterByTerm(data.filter.term)
			.filterBySellable(true);

		const categoryIds = data.filter.category_id
			? await this.resolveCategorySubtree(data.filter.category_id)
			: [];

		if (categoryIds.length) {
			// Its own join: `product_category` above is a LEFT join feeding the label, and
			// narrowing it would turn every listed product into a category match
			query
				.join('product.categories', 'category_filter', 'INNER')
				.filterRaw('category_filter.category_id IN (:...categoryIds)', {
					categoryIds,
				});
		}

		if (data.filter.tag_id?.length) {
			query
				.join('product.tags', 'tag', 'INNER')
				.filterBy('tag.tag_id', [...data.filter.tag_id], 'IN');
		}

		if (data.filter.exclude_id) {
			query.filterBy('product.id', data.filter.exclude_id, '!=');
		}

		await this.applyFacets(query, data.filter.attribute, categoryIds);

		const [entries, total] = await query
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);

		return [await this.attachCoverImages(entries), total] as const;
	}

	public async findByFilter(
		data: ValidatorOutput<ProductValidator, 'find'>,
		withDeleted: boolean,
	) {
		const query = this.repository
			.createQuery()
			.join(
				'product.contents',
				'content',
				'LEFT',
				'content.language = :language',
				{ language: data.filter.language },
			)
			.join('product.brand', 'brand', 'LEFT')
			// Pinned to live links for the same reason as `getEntryData`: `withDeleted` is
			// about listing deleted products, not about naming categories they were unlinked
			// from
			.join(
				'product.categories',
				'product_category',
				'LEFT',
				'product_category.deleted_at IS NULL',
			)
			.join('product_category.category', 'category', 'LEFT')
			.join(
				'category.contents',
				'category_content',
				'LEFT',
				'category_content.language = :language',
			)
			.join(
				'product.variants',
				'variant',
				'LEFT',
				'variant.is_default = true AND variant.deleted_at IS NULL',
			)
			.join('variant.prices', 'price', 'LEFT', 'price.deleted_at IS NULL')
			.select([
				'product.id',
				'product.workflow',
				'product.sale_status',
				'product.type',
				'product.composition',
				'product.unit',
				'product.vat_category',
				'product.available_from',
				'product.available_until',
				'product.discontinued_at',
				'product.brand_id',
				'product.created_at',
				'product.updated_at',
				'product.deleted_at',

				'content.language',
				'content.slug',
				'content.label',

				'brand.id',
				'brand.name',

				'product_category.id',
				'product_category.category_id',
				'category.id',
				'category_content.id',
				'category_content.language',
				'category_content.label',

				'variant.id',
				'variant.sku',
				'variant.track_stock',
				'price.id',
				'price.currency',
				'price.sale_price',
			])
			.filterById(data.filter.id)
			.filterBy('product.workflow', data.filter.workflow)
			.filterBy('product.type', data.filter.type)
			.filterBy('product.composition', data.filter.composition)
			.filterBy('product.sale_status', data.filter.sale_status)
			.filterBy('product.brand_id', data.filter.brand_id)
			.filterByTerm(data.filter.term)
			.filterBySellable(data.filter.is_sellable)
			.withDeleted(withDeleted && data.filter.is_deleted);

		if (data.filter.category_id) {
			query
				.join('product.categories', 'category_filter', 'INNER')
				.filterRaw('category_filter.category_id IN (:...categoryIds)', {
					categoryIds: await this.resolveCategorySubtree(
						data.filter.category_id,
					),
				});
		}

		if (data.filter.tag_id) {
			query
				.join('product.tags', 'tag', 'INNER')
				.filterBy('tag.tag_id', data.filter.tag_id);
		}

		return query
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const productService = new ProductService(getProductRepository());

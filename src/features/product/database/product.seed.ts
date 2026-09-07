import {
	isDirectRun,
	loadIds,
	randomInt,
	randomPick,
	type SeedDefinition,
	type SeedSummary,
	sequenceLabel,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import BrandEntity from '@/features/brand/brand.entity';
import CategoryEntity, {
	CategoryTypeEnum,
} from '@/features/category/category.entity';
import CategoryContentEntity from '@/features/category/category-content.entity';
import ProductEntity, {
	ProductCompositionEnum,
	ProductSaleStatusEnum,
	ProductTypeEnum,
	ProductUnitEnum,
	ProductVatCategoryEnum,
	ProductWorkflowEnum,
} from '@/features/product/product.entity';
import ProductAttributeEntity from '@/features/product/product-attribute.entity';
import ProductAvailabilityEntity from '@/features/product/product-availability.entity';
import ProductBundleItemEntity from '@/features/product/product-bundle-item.entity';
import ProductCategoryEntity from '@/features/product/product-category.entity';
import ProductCategoryAttributeEntity, {
	ProductCategoryAttributeScopeEnum,
	ProductCategoryAttributeTypeEnum,
	ProductCategoryAttributeValueTypeEnum,
} from '@/features/product/product-category-attribute.entity';
import ProductCategoryAttributeOptionEntity from '@/features/product/product-category-attribute-option.entity';
import ProductContentEntity from '@/features/product/product-content.entity';
import ProductOptionEntity from '@/features/product/product-option.entity';
import ProductOptionGroupEntity from '@/features/product/product-option-group.entity';
import ProductOptionPriceEntity from '@/features/product/product-option-price.entity';
import ProductPriceEntity from '@/features/product/product-price.entity';
import ProductTagEntity from '@/features/product/product-tag.entity';
import ProductVariantEntity from '@/features/product/product-variant.entity';
import ProductVariantAttributeEntity from '@/features/product/product-variant-attribute.entity';
import TermEntity, { TermTypeEnum } from '@/features/term/term.entity';
import TermContentEntity from '@/features/term/term-content.entity';
import { MeasureUnitEnum, toBaseUnit } from '@/shared/types/measure-unit.type';

const TARGET = 48;

const NAMES: readonly string[] = [
	'Aurora 14 Ultrabook',
	'Meridian 27 Monitor',
	'Halcyon Wireless Headset',
	'Northwind Mechanical Keyboard',
	'Tessellate Desk Mat',
	'Lumen Desk Lamp',
	'Cascade USB-C Hub',
	'Basalt Laptop Stand',
	'Quill Bluetooth Mouse',
	'Solstice Bookshelf Speaker',
	'Portico Laser Printer',
	'Vellum Document Scanner',
	'Kestrel Webcam',
	'Anvil Cable Sleeve',
	'Ferrite Charging Cable',
	'Cobalt Power Strip',
];

/**
 * The definitions the seeded products answer to.
 *
 * Two scopes, on purpose: *Color* asked once for the product and *Size* asked once per variant
 * are different products, and the split is what the form uses to place a value. *Capacity* is
 * the numeric case — the number goes in `value_numeric` bare and `ml` comes from the definition,
 * which is what makes "between 300 and 600 ml" an indexed comparison.
 */
const DEFINITIONS: readonly {
	category_slug: string;
	label: string;
	scope: (typeof ProductCategoryAttributeScopeEnum)[keyof typeof ProductCategoryAttributeScopeEnum];
	value_type: (typeof ProductCategoryAttributeValueTypeEnum)[keyof typeof ProductCategoryAttributeValueTypeEnum];
	type: (typeof ProductCategoryAttributeTypeEnum)[keyof typeof ProductCategoryAttributeTypeEnum];
	unit?: (typeof MeasureUnitEnum)[keyof typeof MeasureUnitEnum];
	min_value?: number;
	max_value?: number;
	options?: readonly string[];
	sort_order: number;
}[] = [
	{
		category_slug: 'electronics',
		label: 'color',
		scope: ProductCategoryAttributeScopeEnum.PRODUCT,
		value_type: ProductCategoryAttributeValueTypeEnum.TERM,
		type: ProductCategoryAttributeTypeEnum.SELECT,
		options: ['red', 'blue', 'green', 'black'],
		sort_order: 10,
	},
	{
		category_slug: 'electronics',
		label: 'size',
		scope: ProductCategoryAttributeScopeEnum.VARIANT,
		value_type: ProductCategoryAttributeValueTypeEnum.TERM,
		type: ProductCategoryAttributeTypeEnum.RADIO,
		options: ['small', 'medium', 'large'],
		sort_order: 20,
	},
	{
		category_slug: 'accessories',
		label: 'material',
		scope: ProductCategoryAttributeScopeEnum.PRODUCT,
		value_type: ProductCategoryAttributeValueTypeEnum.TERM,
		type: ProductCategoryAttributeTypeEnum.SELECT,
		options: ['cotton', 'leather'],
		sort_order: 10,
	},
	{
		category_slug: 'home-and-garden',
		label: 'capacity',
		scope: ProductCategoryAttributeScopeEnum.PRODUCT,
		value_type: ProductCategoryAttributeValueTypeEnum.NUMBER,
		type: ProductCategoryAttributeTypeEnum.INPUT,
		unit: MeasureUnitEnum.MILLILITRE,
		min_value: 100,
		max_value: 5000,
		sort_order: 10,
	},
];

/** Terms are stored lower-cased, so the seed matches on the same form the term seed writes. */
const termKey = (type: string, value: string): string =>
	`${type}:${value.trim().toLowerCase()}`;

export const productSeed: SeedDefinition = {
	name: 'product',
	run: async ({ manager, random }): Promise<SeedSummary> => {
		const productRepository = manager.getRepository(ProductEntity);
		const contentRepository = manager.getRepository(ProductContentEntity);
		const categoryLinkRepository = manager.getRepository(
			ProductCategoryEntity,
		);
		const tagLinkRepository = manager.getRepository(ProductTagEntity);
		const variantRepository = manager.getRepository(ProductVariantEntity);
		const priceRepository = manager.getRepository(ProductPriceEntity);
		const attributeRepository = manager.getRepository(
			ProductAttributeEntity,
		);
		const variantAttributeRepository = manager.getRepository(
			ProductVariantAttributeEntity,
		);
		const availabilityRepository = manager.getRepository(
			ProductAvailabilityEntity,
		);
		const optionGroupRepository = manager.getRepository(
			ProductOptionGroupEntity,
		);
		const optionRepository = manager.getRepository(ProductOptionEntity);
		const optionPriceRepository = manager.getRepository(
			ProductOptionPriceEntity,
		);
		const bundleItemRepository = manager.getRepository(
			ProductBundleItemEntity,
		);
		const definitionRepository = manager.getRepository(
			ProductCategoryAttributeEntity,
		);
		const definitionOptionRepository = manager.getRepository(
			ProductCategoryAttributeOptionEntity,
		);

		// Product categories only: an article category linked to a product would file it under a
		// tree the storefront never shows
		const categories = await manager.getRepository(CategoryEntity).find({
			select: { id: true },
			where: { type: CategoryTypeEnum.PRODUCT },
			order: { id: 'ASC' },
		});

		const categoryIds = categories.map((category) => category.id);

		const categoryContents = await manager
			.getRepository(CategoryContentEntity)
			.find({
				select: { category_id: true, slug: true },
				where: { language: 'en' },
			});

		const categoryIdBySlug = new Map(
			categoryContents.map((content) => [
				content.slug,
				content.category_id,
			]),
		);

		const brandIds = await loadIds(manager, BrandEntity);

		// The term id behind each label and value, keyed by type plus wording — the seed states
		// the vocabulary in words and the tables store ids
		const termContents = await manager
			.getRepository(TermContentEntity)
			.find({
				select: { term_id: true, value: true },
				where: { language: 'en' },
				relations: { term: true },
			});

		const termIdByKey = new Map(
			termContents
				.filter((content) => content.term)
				.map((content) => [
					termKey(content.term.type, content.value),
					content.term_id,
				]),
		);

		const labelId = (label: string): number | undefined =>
			termIdByKey.get(termKey(TermTypeEnum.ATTRIBUTE_LABEL, label));

		const valueId = (value: string): number | undefined =>
			termIdByKey.get(termKey(TermTypeEnum.ATTRIBUTE_VALUE, value));

		const tagIds = await loadIds(manager, TermEntity, {
			type: TermTypeEnum.TAG,
		});

		/*
		 * The definitions come first: a product attribute is only meaningful against the
		 * definition that governs its label, and the resolve endpoint has nothing to answer
		 * with until they exist.
		 */
		const existingDefinitions = await definitionRepository.find({
			select: { category_id: true, attribute_label_id: true },
			withDeleted: true,
		});

		const definedKeys = new Set(
			existingDefinitions.map(
				(row) => `${row.category_id}:${row.attribute_label_id}`,
			),
		);

		for (const row of DEFINITIONS) {
			const category_id = categoryIdBySlug.get(row.category_slug);
			const attribute_label_id = labelId(row.label);

			if (!category_id || !attribute_label_id) {
				continue;
			}

			if (definedKeys.has(`${category_id}:${attribute_label_id}`)) {
				continue;
			}

			const definition = await definitionRepository.save(
				definitionRepository.create({
					category_id,
					attribute_label_id,
					scope: row.scope,
					value_type: row.value_type,
					type: row.type,
					unit: row.unit ?? null,
					min_value: row.min_value ?? null,
					max_value: row.max_value ?? null,
					is_required: false,
					is_filterable: true,
					inherit: true,
					sort_order: row.sort_order,
				}),
			);

			const options = (row.options ?? [])
				.map((value, index) => ({
					term_id: valueId(value),
					sort_order: (index + 1) * 10,
				}))
				.filter((option) => option.term_id !== undefined);

			if (options.length) {
				await definitionOptionRepository.save(
					options.map((option) =>
						definitionOptionRepository.create({
							attribute_id: definition.id,
							term_id: option.term_id as number,
							sort_order: option.sort_order,
						}),
					),
				);
			}

			definedKeys.add(`${category_id}:${attribute_label_id}`);
		}

		/*
		 * The slug lives on the content row, so that is where the natural key is read from — the
		 * product itself carries no code of its own. Same shape as `article.seed.ts`.
		 */
		const existingContent = await contentRepository.find({
			select: { slug: true },
		});

		const existingSlugs = new Set(
			existingContent.map((content) => content.slug),
		);

		const colorValues = ['red', 'blue', 'green', 'black'];
		const sizeValues = ['small', 'medium', 'large'];

		let alreadyPresent = 0;
		let inserted = 0;

		/** The default variants seeded so far, so a bundle has real components to name. */
		const seededVariantIds: number[] = [];

		for (let index = 0; index < TARGET; index++) {
			const slug = `product-${sequenceLabel(index)}`;

			if (existingSlugs.has(slug)) {
				alreadyPresent++;
				continue;
			}

			// The variant codes are still generated per product, they simply no longer derive
			// from a product-level one. The values are unchanged, so a re-run tops up
			const variantSku = `PRD-${sequenceLabel(index)}`;

			/*
			 * Every eighth product is a bundle, and only once enough simple products exist to
			 * compose one from — a bundle whose components are themselves bundles is rejected
			 * by the service, and here there would be nothing to point at.
			 */
			const isBundle = index > 8 && index % 8 === 0;

			const composition = isBundle
				? ProductCompositionEnum.BUNDLE
				: ProductCompositionEnum.SIMPLE;

			/*
			 * Snapshotted before this product's own default variant joins the pool further
			 * down, because the bundle block below takes the last two. Including its own
			 * variant would write the bundle as a component of itself — the self-reference
			 * `ProductService.assertComponents` rejects with `bundle_self_reference`. The seed
			 * writes through the repositories and so bypasses that guard, which is exactly why
			 * it has to hold the invariant itself.
			 */
			const componentPool = isBundle ? [...seededVariantIds] : [];

			const product = await productRepository.save(
				productRepository.create({
					workflow: randomPick(random, [
						ProductWorkflowEnum.DRAFT,
						ProductWorkflowEnum.PENDING_REVIEW,
						ProductWorkflowEnum.READY,
						ProductWorkflowEnum.READY,
					]),
					sale_status: ProductSaleStatusEnum.AVAILABLE,
					type: ProductTypeEnum.PHYSICAL,
					composition,
					unit: ProductUnitEnum.PIECE,
					vat_category: ProductVatCategoryEnum.STANDARD,
					brand_id: brandIds.length
						? randomPick(random, brandIds)
						: null,
				}),
			);

			const pass = Math.floor(index / NAMES.length);
			const baseName = NAMES[index % NAMES.length];
			const label = pass ? `${baseName} (Mk ${pass + 1})` : baseName;

			await contentRepository.save(
				contentRepository.create({
					product_id: product.id,
					language: 'en',
					slug,
					label: isBundle ? `${label} Bundle` : label,
					description: `${label} — demo catalog entry ${sequenceLabel(index)}.`,
					meta: {
						title: label,
						description: `${label} — specifications and price`,
					},
				}),
			);

			const category_id = categoryIds.length
				? randomPick(random, categoryIds)
				: null;

			if (category_id) {
				await categoryLinkRepository.save(
					categoryLinkRepository.create({
						product_id: product.id,
						category_id,
					}),
				);
			}

			if (tagIds.length) {
				// A set, because two picks can land on the same tag and the link table holds a
				// unique index on (product_id, tag_id)
				const picked = new Set(
					Array.from({ length: randomInt(random, 1, 3) }, () =>
						randomPick(random, tagIds),
					),
				);

				await tagLinkRepository.save(
					Array.from(picked, (tag_id) =>
						tagLinkRepository.create({
							product_id: product.id,
							tag_id,
						}),
					),
				);
			}

			/*
			 * A bundle holds no stock of its own and its header line carries no money, so its
			 * single variant is untracked — that flag is also what keeps it out of shipment
			 * allocation. A simple product gets one to three sized variants.
			 */
			const variantCount = isBundle ? 1 : randomInt(random, 1, 3);
			const basePrice = randomInt(random, 20, 900) + 0.99;

			for (
				let variantIndex = 0;
				variantIndex < variantCount;
				variantIndex++
			) {
				const variant = await variantRepository.save(
					variantRepository.create({
						product_id: product.id,
						sku: `${variantSku}-V${variantIndex + 1}`,
						position: variantIndex,
						is_default: variantIndex === 0,
						track_stock: !isBundle && index % 3 === 0,
						low_stock_threshold:
							!isBundle && index % 3 === 0 ? 5 : null,
						allow_backorder: false,
						cost_price: Number((basePrice * 0.6).toFixed(2)),
					}),
				);

				await priceRepository.save(
					priceRepository.create({
						variant_id: variant.id,
						currency: 'RON',
						sale_price: Number(
							(basePrice + variantIndex * 25).toFixed(2),
						),
						reference_price: Number(
							(basePrice + variantIndex * 25 + 30).toFixed(2),
						),
						min_price: Number((basePrice * 0.8).toFixed(2)),
					}),
				);

				const sizeTermId = valueId(
					sizeValues[variantIndex] ?? 'medium',
				);

				if (variantCount > 1 && sizeTermId) {
					await variantAttributeRepository.save(
						variantAttributeRepository.create({
							variant_id: variant.id,
							attribute_label_id: labelId('size') as number,
							value_term_id: sizeTermId,
						}),
					);
				}

				if (variantIndex === 0) {
					seededVariantIds.push(variant.id);
				}
			}

			const colorTermId = valueId(randomPick(random, colorValues));
			const colorLabelId = labelId('color');

			if (colorTermId && colorLabelId) {
				await attributeRepository.save(
					attributeRepository.create({
						product_id: product.id,
						attribute_label_id: colorLabelId,
						value_term_id: colorTermId,
					}),
				);
			}

			// Every fifth product carries a capacity, so the numeric facet has rows to answer
			// with. `value_base` is the figure in the dimension's base unit — the same
			// conversion the service applies on write
			const capacityLabelId = labelId('capacity');

			if (capacityLabelId && index % 5 === 0) {
				const capacity = randomInt(random, 2, 20) * 100;

				await attributeRepository.save(
					attributeRepository.create({
						product_id: product.id,
						attribute_label_id: capacityLabelId,
						value_numeric: capacity,
						value_base: toBaseUnit(
							capacity,
							MeasureUnitEnum.MILLILITRE,
						),
					}),
				);
			}

			// Every seventh product is orderable on weekday lunchtimes only, so the recurring
			// window branch has rows without every product wearing one. The days are ISO 8601,
			// 1 = Monday, so 1–5 is Monday through Friday
			if (index % 7 === 0) {
				await availabilityRepository.save(
					[1, 2, 3, 4, 5].map((day_of_week) =>
						availabilityRepository.create({
							product_id: product.id,
							day_of_week,
							starts_at: '12:00:00',
							ends_at: '15:00:00',
						}),
					),
				);
			}

			// Every fourth product asks a question at order time. `min_select` 0 and
			// `max_select` 1 is the optional single choice — there is no `is_required` flag to
			// agree with
			if (index % 4 === 0 && colorLabelId) {
				const group = await optionGroupRepository.save(
					optionGroupRepository.create({
						product_id: product.id,
						label_id: colorLabelId,
						min_select: 0,
						max_select: 1,
						position: 0,
					}),
				);

				for (const [optionIndex, value] of colorValues.entries()) {
					const optionTermId = valueId(value);

					if (!optionTermId) {
						continue;
					}

					const option = await optionRepository.save(
						optionRepository.create({
							option_group_id: group.id,
							label_id: optionTermId,
							position: optionIndex,
							is_default: optionIndex === 0,
						}),
					);

					await optionPriceRepository.save(
						optionPriceRepository.create({
							option_id: option.id,
							currency: 'RON',
							// Signed: declining the upgrade legitimately reduces the price
							price_delta:
								optionIndex === 0 ? 0 : optionIndex * 5,
						}),
					);
				}
			}

			/*
			 * Two components, each contributing one unit, so the bundle clears the two-unit
			 * floor `ProductService.assertBundleIsComposed` enforces — a one-component bundle
			 * would be written here and then refused the first time it is edited.
			 */
			if (isBundle && componentPool.length >= 2) {
				const components = componentPool.slice(-2);

				await bundleItemRepository.save(
					components.map((variant_id, position) =>
						bundleItemRepository.create({
							product_id: product.id,
							variant_id,
							quantity: 1,
							position,
						}),
					),
				);
			}

			existingSlugs.add(slug);
			inserted++;
		}

		return {
			entity: 'product',
			alreadyPresent,
			inserted,
			target: TARGET,
			tableTotal: await productRepository.count({ withDeleted: true }),
		};
	},
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(productSeed);
}

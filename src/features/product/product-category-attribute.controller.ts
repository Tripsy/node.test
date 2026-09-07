import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import ProductCategoryAttributeEntity from '@/features/product/product-category-attribute.entity';
import {
	type ProductCategoryAttributePolicy,
	productCategoryAttributePolicy,
} from '@/features/product/product-category-attribute.policy';
import {
	type ProductCategoryAttributeService,
	productCategoryAttributeService,
} from '@/features/product/product-category-attribute.service';
import { ProductCategoryAttributeValidator } from '@/features/product/product-category-attribute.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The schema behind the product form: which attributes a product in a category is expected to
 * carry, how each is captured, and which values are admissible.
 *
 * It holds no product data, which is why it is a module of its own rather than a branch of the
 * product payload — a definition outlives every product that answers to it.
 */
class ProductCategoryAttributeController extends BaseController {
	constructor(
		private policy: ProductCategoryAttributePolicy,
		private validator: ProductCategoryAttributeValidator,
		private cache: CacheProvider,
		private attributeService: ProductCategoryAttributeService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.attributeService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(
			lang('product.success.attribute_definition_create'),
		);

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const withDeleted = this.policy.allowDeleted(res.locals.auth);

		const cacheGetResults = await this.cache.get(
			this.cache.buildKey(
				ProductCategoryAttributeEntity.NAME,
				data.id.toString(),
				withDeleted ? 'with-deleted' : 'non-deleted',
				'read',
			),
			() => this.attributeService.getEntryData(data.id, withDeleted),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.update,
			{
				...req.body,
				id: req.params.id,
			},
			res,
		);

		const existingEntry = await this.attributeService.findById(
			data.id,
			false,
		);

		const entry = await this.attributeService.updateData(
			existingEntry,
			data,
		);

		res.locals.output.message(
			lang('product.success.attribute_definition_update'),
		);
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.attributeService.delete(data.id);

		res.locals.output.message(
			lang('product.success.attribute_definition_delete'),
		);

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.attributeService.restore(data.id);

		res.locals.output.message(
			lang('product.success.attribute_definition_restore'),
		);

		res.json(res.locals.output);
	});

	/**
	 * The resolved form for a set of categories — the union across them and their ancestors,
	 * deduped by label with the deepest category winning, split by scope.
	 *
	 * This is what the product editor renders from, so it takes the categories the form is
	 * being drawn for rather than a product id: a product being created has no id yet.
	 */
	public resolve = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.resolve, req.query, res);

		res.locals.output.data(
			await this.attributeService.resolveForm(data.category_id),
		);

		res.json(res.locals.output);
	});

	public orderUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(this.validator.orderUpdate, req.body, res);

		await this.attributeService.updateOrder(
			data.category_id,
			data.positions,
		);

		res.locals.output.message(
			lang('product.success.attribute_order_update'),
		);

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.attributeService.findByFilter(
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: data.page,
				limit: data.limit,
				total: total,
			},
			query: data,
		});

		res.json(res.locals.output);
	});
}

export const productCategoryAttributeController =
	new ProductCategoryAttributeController(
		productCategoryAttributePolicy,
		new ProductCategoryAttributeValidator('product'),
		cacheProvider,
		productCategoryAttributeService,
	);

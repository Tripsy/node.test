import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import ProductEntity from '@/features/product/product.entity';
import {
	type ProductPolicy,
	productPolicy,
} from '@/features/product/product.policy';
import {
	type ProductService,
	productService,
} from '@/features/product/product.service';
import { ProductValidator } from '@/features/product/product.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class ProductController extends BaseController {
	constructor(
		private policy: ProductPolicy,
		private validator: ProductValidator,
		private cache: CacheProvider,
		private productService: ProductService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.productService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('product.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(
			this.validator.read,
			{
				...req.query,
				id: req.params.id,
			},
			res,
		);

		/*
		 * An omitted `language` means every translation, not the request's own — the dashboard
		 * edits all of them at once and has no other way to ask.
		 */
		const language = data.language;
		const withDeleted = this.policy.allowDeleted(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			ProductEntity.NAME,
			data.id.toString(),
			language ?? 'all-languages',
			withDeleted ? 'with-deleted' : 'non-deleted',
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, () =>
			this.productService.getEntryData({
				id: data.id,
				language,
				withDeleted,
			}),
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

		const existingEntry = await this.productService.findById(
			data.id,
			false,
		);

		const entry = await this.productService.updateDataWithContent(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('product.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.productService.delete(data.id);

		res.locals.output.message(lang('product.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.productService.restore(data.id);

		res.locals.output.message(lang('product.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		if (!data.filter.language) {
			data.filter.language = res.locals.language;
		}

		const [entries, total] = await this.productService.findByFilter(
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

	/**
	 * The editorial state, moved one hop at a time through `WORKFLOW_TRANSITIONS`. The other
	 * status a product carries — `sale_status` — has no route: it is derived from the
	 * availability timestamps, which `update` is where an editor changes.
	 */
	public workflowUpdate = asyncHandler(
		async (req: Request, res: Response) => {
			this.policy.canUpdate(res.locals.auth);

			const data = this.validate(
				this.validator.workflowUpdate,
				req.params,
				res,
			);

			const existingEntry = await this.productService.findById(
				data.id,
				false,
			);

			await this.productService.updateWorkflow(
				existingEntry,
				data.workflow,
			);

			res.locals.output.message(lang('product.success.workflow_update'));

			res.json(res.locals.output);
		},
	);
}

export const productController = new ProductController(
	productPolicy,
	new ProductValidator('product'),
	cacheProvider,
	productService,
);

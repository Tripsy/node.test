import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import ExchangeRateEntity from '@/features/exchange-rate/exchange-rate.entity';
import {
	type ExchangeRatePolicy,
	exchangeRatePolicy,
} from '@/features/exchange-rate/exchange-rate.policy';
import {
	type ExchangeRateService,
	exchangeRateService,
} from '@/features/exchange-rate/exchange-rate.service';
import { ExchangeRateValidator } from '@/features/exchange-rate/exchange-rate.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class ExchangeRateController extends BaseController {
	constructor(
		private policy: ExchangeRatePolicy,
		private validator: ExchangeRateValidator,
		private cache: CacheProvider,
		private exchangeRateService: ExchangeRateService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.exchangeRateService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('exchange-rate.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const cacheKey = this.cache.buildKey(
			ExchangeRateEntity.NAME,
			data.id.toString(),
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, () =>
			this.exchangeRateService.getEntryData({ id: data.id }),
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

		const existingEntry = await this.exchangeRateService.findById(data.id);

		const entry = await this.exchangeRateService.updateData(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('exchange-rate.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.exchangeRateService.delete(data.id);

		res.locals.output.message(lang('exchange-rate.success.delete'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] =
			await this.exchangeRateService.findByFilter(data);

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

export const exchangeRateController = new ExchangeRateController(
	exchangeRatePolicy,
	new ExchangeRateValidator('exchange-rate'),
	cacheProvider,
	exchangeRateService,
);

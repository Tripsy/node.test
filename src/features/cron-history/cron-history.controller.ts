import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import CronHistoryEntity from '@/features/cron-history/cron-history.entity';
import { cronHistoryPolicy } from '@/features/cron-history/cron-history.policy';
import {
	type CronHistoryService,
	cronHistoryService,
} from '@/features/cron-history/cron-history.service';
import {
	type CronHistoryValidator,
	type CronHistoryValidatorDeleteDto,
	type CronHistoryValidatorFindDto,
	cronHistoryValidator,
} from '@/features/cron-history/cron-history.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class CronHistoryController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: CronHistoryValidator,
		private cache: CacheProvider,
		private cronHistoryService: CronHistoryService,
	) {
		super();
	}

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			CronHistoryEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const entry = await this.cache.get(cacheKey, async () =>
			this.cronHistoryService.findById(res.locals.validated.id),
		);

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate<CronHistoryValidatorDeleteDto>(
			this.validator.delete(),
			req.body,
			res,
		);

		const countDelete = await this.cronHistoryService.delete(data);

		if (countDelete === 0) {
			res.status(204).locals.output.message(
				lang('shared.error.db_delete_zero'),
			); // Note: By API design the response message is actually not displayed for 204
		} else {
			res.locals.output.message(lang('cron-history.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate<CronHistoryValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

		const [entries, total] =
			await this.cronHistoryService.findByFilter(data);

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

export function createCronHistoryController(deps: {
	policy: PolicyAbstract;
	validator: CronHistoryValidator;
	cache: CacheProvider;
	cronHistoryService: CronHistoryService;
}) {
	return new CronHistoryController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.cronHistoryService,
	);
}

export const cronHistoryController = createCronHistoryController({
	policy: cronHistoryPolicy,
	validator: cronHistoryValidator,
	cache: cacheProvider,
	cronHistoryService: cronHistoryService,
});

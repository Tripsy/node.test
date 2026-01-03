import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import CronHistoryEntity from '@/features/cron-history/cron-history.entity';
import { cronHistoryPolicy } from '@/features/cron-history/cron-history.policy';
import { getCronHistoryRepository } from '@/features/cron-history/cron-history.repository';
import {
	CronHistoryDeleteValidator,
	CronHistoryFindValidator,
} from '@/features/cron-history/cron-history.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import { BadRequestError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class CronHistoryController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: ICronHistoryValidator,
		private cache: CacheProvider,
		private cronHistoryService: ICronHistoryService,
	) {
		super();
	}
	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = cacheProvider.buildKey(
			CronHistoryEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const cronHistory = await cacheProvider.get(cacheKey, async () => {
			return getCronHistoryRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(this.policy.allowDeleted(res.locals.auth))
				.firstOrFail();
		});

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(cronHistory);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const validated = CronHistoryDeleteValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const countDelete: number = await getCronHistoryRepository()
			.createQuery()
			.filterBy('id', validated.data.ids, 'IN')
			.delete(false, true, true);

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

		// Validate against the schema
		const validated = CronHistoryFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const [entries, total] = await getCronHistoryRepository()
			.createQuery()
			.filterById(validated.data.filter.id)
			.filterByRange(
				'start_at',
				validated.data.filter.start_date_start,
				validated.data.filter.start_date_end,
			)
			.filterBy('status', validated.data.filter.status)
			.filterByTerm(validated.data.filter.term)
			.orderBy(validated.data.order_by, validated.data.direction)
			.pagination(validated.data.page, validated.data.limit)
			.all(true);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: validated.data.page,
				limit: validated.data.limit,
				total: total,
			},
			query: validated.data,
		});

		res.json(res.locals.output);
	});
}

export function createCronHistoryController(deps: {
	policy: PolicyAbstract;
	validator: ICronHistoryValidator;
	cache: CacheProvider;
	cronHistoryService: ICronHistoryService;
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

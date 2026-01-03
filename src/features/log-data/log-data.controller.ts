import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import LogDataEntity from '@/features/log-data/log-data.entity';
import { logDataPolicy } from '@/features/log-data/log-data.policy';
import { getLogDataRepository } from '@/features/log-data/log-data.repository';
import {
	LogDataDeleteValidator,
	LogDataFindValidator,
} from '@/features/log-data/log-data.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import { BadRequestError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class LogDataController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: ILogDataValidator,
		private cache: CacheProvider,
		private logDataService: ILogDataService,
	) {
		super();
	}

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = cacheProvider.buildKey(
			LogDataEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const logData = await cacheProvider.get(cacheKey, async () => {
			return getLogDataRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(this.policy.allowDeleted(res.locals.auth))
				.firstOrFail();
		});

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(logData);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const validated = LogDataDeleteValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const countDelete: number = await getLogDataRepository()
			.createQuery()
			.filterBy('id', validated.data.ids, 'IN')
			.delete(false, true, true);

		if (countDelete === 0) {
			res.status(204).locals.output.message(
				lang('shared.error.db_delete_zero'),
			); // Note: By API design the response message is actually not displayed for 204
		} else {
			res.locals.output.message(lang('log-data.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		// Validate against the schema
		const validated = LogDataFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}
		const [entries, total] = await getLogDataRepository()
			.createQuery()
			.filterById(validated.data.filter.id)
			.filterByRange(
				'created_at',
				validated.data.filter.create_date_start,
				validated.data.filter.create_date_end,
			)
			.filterBy('category', validated.data.filter.category)
			.filterBy('level', validated.data.filter.level)
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

export function createLogDataController(deps: {
	policy: PolicyAbstract;
	validator: ILogDataValidator;
	cache: CacheProvider;
	logDataService: ILogDataService;
}) {
	return new LogDataController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.logDataService,
	);
}

export const logDataController = createLogDataController({
	policy: logDataPolicy,
	validator: logDataValidator,
	cache: cacheProvider,
	logDataService: logDataService,
});

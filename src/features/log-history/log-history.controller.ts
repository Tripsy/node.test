import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import type { CarrierValidatorFindDto } from '@/features/carrier/carrier.validator';
import { logHistoryPolicy } from '@/features/log-history/log-history.policy';
import { getLogHistoryRepository } from '@/features/log-history/log-history.repository';
import {
	LogHistoryDeleteValidator,
	LogHistoryFindValidator,
} from '@/features/log-history/log-history.validator';
import type { UserValidatorCreateDto } from '@/features/user/user.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import { BadRequestError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class LogHistoryController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: ILogHistoryValidator,
		private cache: CacheProvider,
		private logHistoryService: ILogHistoryService,
	) {
		super();
	}

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const logHistory = await getLogHistoryRepository()
			.createQuery()
			.join('log_history.user', 'user', 'LEFT')
			.filterById(res.locals.validated.id)
			.firstOrFail();

		res.locals.output.data(logHistory);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate<UserValidatorCreateDto>(
			this.validator.create(),
			req.body,
			res,
		);

		const countDelete: number = await getLogHistoryRepository()
			.createQuery()
			.filterBy('id', validated.data.ids, 'IN')
			.delete(false, true, true);

		if (countDelete === 0) {
			res.status(204).locals.output.message(
				lang('shared.error.db_delete_zero'),
			);
		} else {
			res.locals.output.message(lang('log-history.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate<CarrierValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

		const [entries, total] = await getLogHistoryRepository()
			.createQuery()
			.join('log_history.user', 'user', 'LEFT')
			.filterBy('request_id', validated.data.filter.request_id)
			.filterBy('entity', validated.data.filter.entity)
			.filterBy('entity_id', validated.data.filter.entity_id)
			.filterBy('action', validated.data.filter.action)
			.filterBy('source', validated.data.filter.source)
			.filterByRange(
				'recorded_at',
				validated.data.filter.recorded_at_start,
				validated.data.filter.recorded_at_end,
			)
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

export function createLogHistoryController(deps: {
	policy: PolicyAbstract;
	validator: ILogHistoryValidator;
	cache: CacheProvider;
	logHistoryService: ILogHistoryService;
}) {
	return new LogHistoryController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.logHistoryService,
	);
}

export const logHistoryController = createLogHistoryController({
	policy: logHistoryPolicy,
	validator: logHistoryValidator,
	cache: cacheProvider,
	logHistoryService: logHistoryService,
});

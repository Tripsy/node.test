import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';
import LogDataPolicy from '@/features/log-data/log-data.policy';
import {
	getLogDataRepository,
	LogDataQuery,
} from '@/features/log-data/log-data.repository';
import {
	LogDataDeleteValidator,
	LogDataFindValidator,
} from '@/features/log-data/log-data.validator';
import asyncHandler from '@/helpers/async.handler';
import { getCacheProvider } from '@/providers/cache.provider';

class LogDataController {
	public read = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new LogDataPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.read();

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			LogDataQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);

		const logData = await cacheProvider.get(cacheKey, async () => {
			return getLogDataRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();
		});

		res.locals.output.meta(cacheProvider.isCached, 'isCached');
		res.locals.output.data(logData);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new LogDataPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.delete();

		const validated = LogDataDeleteValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const countDelete: number = await getLogDataRepository()
			.createQuery()
			.filterBy('id', validated.data.ids, 'IN')
			.delete(false, true);

		if (countDelete === 0) {
			res.status(204).locals.output.message(lang('error.db_delete_zero')); // Note: By API design the response message is actually not displayed for 204
		} else {
			res.locals.output.message(lang('log_data.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new LogDataPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = LogDataFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.errors);

			throw new BadRequestError();
		}
		const [entries, total] = await getLogDataRepository()
			.createQuery()
			.filterById(validated.data.filter.id)
			.filterBy('pid', validated.data.filter.pid)
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

export default new LogDataController();

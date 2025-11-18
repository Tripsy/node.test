import type { Request, Response } from 'express';
import { lang } from '@/config/i18n-setup.config';
import BadRequestError from '@/exceptions/bad-request.error';
import CronHistoryPolicy from '@/features/cron-history/cron-history.policy';
import CronHistoryRepository, {
	CronHistoryQuery,
} from '@/features/cron-history/cron-history.repository';
import CronHistoryDeleteValidator from '@/features/cron-history/cron-history-delete.validator';
import CronHistoryFindValidator from '@/features/cron-history/cron-history-find.validator';
import asyncHandler from '@/helpers/async.handler';
import { logHistory } from '@/helpers/subscriber.helper';
import { getCacheProvider } from '@/providers/cache.provider';

class CronHistoryController {
	public read = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CronHistoryPolicy(req);

		// Check permission (admin or operator with permission)
		policy.read();

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			CronHistoryQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);
		const cronHistory = await cacheProvider.get(cacheKey, async () => {
			return CronHistoryRepository.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();
		});

		res.output.meta(cacheProvider.isCached, 'isCached');
		res.output.data(cronHistory);

		res.json(res.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CronHistoryPolicy(req);

		// Check permission (admin or operator with permission)
		policy.delete();

		const validated = CronHistoryDeleteValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const countDelete: number = await CronHistoryRepository.createQuery()
			.filterBy('id', validated.data.ids, 'IN')
			.delete(false, true);

		if (countDelete === 0) {
			res.status(204).output.message(lang('error.db_delete_zero')); // Note: By API design the response message is actually not displayed for 204
		} else {
			logHistory(CronHistoryQuery.entityAlias, 'deleted', {
				auth_id: policy.getUserId()?.toString() || '0',
			});

			res.output.message(lang('cron_history.success.delete'));
		}

		res.json(res.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CronHistoryPolicy(req);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = CronHistoryFindValidator.safeParse(req.query);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const [entries, total] = await CronHistoryRepository.createQuery()
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

		res.output.data({
			entries: entries,
			pagination: {
				page: validated.data.page,
				limit: validated.data.limit,
				total: total,
			},
			query: validated.data,
		});

		res.json(res.output);
	});
}

export default new CronHistoryController();

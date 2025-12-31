import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import LogHistoryPolicy from '@/features/log-history/log-history.policy';
import { getLogHistoryRepository } from '@/features/log-history/log-history.repository';
import {
	LogHistoryDeleteValidator,
	LogHistoryFindValidator,
} from '@/features/log-history/log-history.validator';
import asyncHandler from '@/lib/helpers/async.handler';
import {BadRequestError} from "@/lib/exceptions";

class LogHistoryController {
	public read = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new LogHistoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.read();

		const logHistory = await getLogHistoryRepository()
			.createQuery()
			.join('log_history.user', 'user', 'LEFT')
			.filterById(res.locals.validated.id)
			.firstOrFail();

		res.locals.output.data(logHistory);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new LogHistoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.delete();

		const validated = LogHistoryDeleteValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

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
		const policy = new LogHistoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = LogHistoryFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

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

export default new LogHistoryController();

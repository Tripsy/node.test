import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';
import MailQueuePolicy from '@/features/mail-queue/mail-queue.policy';
import {
	getMailQueueRepository,
	MailQueueQuery,
} from '@/features/mail-queue/mail-queue.repository';
import {
	MailQueueDeleteValidator,
	MailQueueFindValidator,
} from '@/features/mail-queue/mail-queue.validator';
import { logHistory } from '@/helpers';
import asyncHandler from '@/helpers/async.handler';
import { getCacheProvider } from '@/providers/cache.provider';

class MailQueueController {
	public read = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new MailQueuePolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.read();

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			MailQueueQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);

		const mailQueue = await cacheProvider.get(cacheKey, async () => {
			return getMailQueueRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.firstOrFail();
		});

		res.locals.output.meta(cacheProvider.isCached, 'isCached');
		res.locals.output.data(mailQueue);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new MailQueuePolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.delete();

		const validated = MailQueueDeleteValidator.safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const countDelete: number = await getMailQueueRepository()
			.createQuery()
			.filterBy('id', validated.data.ids, 'IN')
			.delete(false, true);

		if (countDelete === 0) {
			res.status(204).locals.output.message(lang('error.db_delete_zero')); // Note: By API design the response message is actually not displayed for 204
		} else {
			logHistory(
				MailQueueQuery.entityAlias,
				validated.data.ids,
				'deleted',
			);

			res.locals.output.message(lang('mail_queue.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new MailQueuePolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = MailQueueFindValidator.safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const querySelect = [
			'id',
			'template.id',
			'template.label',
			'language',
			'content',
			'to',
			'from',
			'status',
			'error',
			'sent_at',
			'created_at',
			'updated_at',
		];

		const [entries, total] = await getMailQueueRepository()
			.createQuery()
			.select(querySelect)
			.join('mail_queue.template', 'template', 'LEFT')
			.filterById(validated.data.filter.id)
			.filterByRange(
				'sent_at',
				validated.data.filter.sent_date_start,
				validated.data.filter.sent_date_end,
			)
			.filterBy('status', validated.data.filter.status)
			.filterByTemplate(validated.data.filter.template)
			.filterBy('content::text', validated.data.filter.content, 'ILIKE')
			.filterBy('to::text', validated.data.filter.to, 'ILIKE')
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

export default new MailQueueController();

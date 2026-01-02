import type { Request, Response } from 'express';
import { eventEmitter } from '@/config/event.config';
import { lang } from '@/config/i18n.setup';
import { LogHistoryAction } from '@/features/log-history/log-history.entity';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import { getMailQueueRepository } from '@/features/mail-queue/mail-queue.repository';
import {
	MailQueueDeleteValidator,
	MailQueueFindValidator,
} from '@/features/mail-queue/mail-queue.validator';
import { BadRequestError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {cacheProvider, type CacheProvider} from '@/lib/providers/cache.provider';
import {BaseController} from "@/lib/abstracts/controller.abstract";
import type PolicyAbstract from "@/lib/abstracts/policy.abstract";
import {mailQueuePolicy} from "@/features/mail-queue/mail-queue.policy";

class MailQueueController extends BaseController {
    constructor(
        private policy: PolicyAbstract,
        private validator: IMailQueueValidator,
        private cache: CacheProvider,
        private mailQueueService: IMailQueueService,
    ) {
        super();
    }
    
	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = cacheProvider.buildKey(
			MailQueueEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const mailQueue = await cacheProvider.get(cacheKey, async () => {
			return getMailQueueRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.firstOrFail();
		});

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(mailQueue);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const validated = MailQueueDeleteValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const countDelete: number = await getMailQueueRepository()
			.createQuery()
			.filterBy('id', validated.data.ids, 'IN')
			.delete(false, true, true);

		if (countDelete === 0) {
			res.status(204).locals.output.message(
				lang('shared.error.db_delete_zero'),
			); // Note: By API design the response message is actually not displayed for 204
		} else {
			eventEmitter.emit('history', {
				entity: MailQueueEntity.NAME,
				entity_ids: validated.data.ids,
				action: LogHistoryAction.DELETED,
			});

			res.locals.output.message(lang('mail-queue.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		// Validate against the schema
		const validated = MailQueueFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

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

export function createMailQueueController(deps: {
    policy: PolicyAbstract;
    validator: IMailQueueValidator;
    cache: CacheProvider;
    mailQueueService: IMailQueueService;
}) {
    return new MailQueueController(
        deps.policy,
        deps.validator,
        deps.cache,
        deps.mailQueueService,
    );
}

export const mailQueueController = createMailQueueController({
    policy: mailQueuePolicy,
    validator: mailQueueValidator,
    cache: cacheProvider,
    mailQueueService: mailQueueService,
});

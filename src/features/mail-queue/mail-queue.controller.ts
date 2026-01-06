import type { Request, Response } from 'express';
import { eventEmitter } from '@/config/event.config';
import { lang } from '@/config/i18n.setup';
import { LogHistoryAction } from '@/features/log-history/log-history.entity';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import { mailQueuePolicy } from '@/features/mail-queue/mail-queue.policy';
import {
	type MailQueueService,
	mailQueueService,
} from '@/features/mail-queue/mail-queue.service';
import {
	type MailQueueValidator,
	type MailQueueValidatorDeleteDto,
	type MailQueueValidatorFindDto,
	mailQueueValidator,
} from '@/features/mail-queue/mail-queue.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class MailQueueController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: MailQueueValidator,
		private cache: CacheProvider,
		private mailQueueService: MailQueueService,
	) {
		super();
	}

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			MailQueueEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const entry = await this.cache.get(cacheKey, async () =>
			this.mailQueueService.findById(res.locals.validated.id),
		);

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate<MailQueueValidatorDeleteDto>(
			this.validator.delete(),
			req.body,
			res,
		);

		const countDelete = await this.mailQueueService.delete(data);

		if (countDelete === 0) {
			res.status(409).locals.output.message(
				lang('shared.error.db_delete_zero'),
			); // Note: By API design the response message is actually not displayed for 204
		} else {
			eventEmitter.emit('history', {
				entity: MailQueueEntity.NAME,
				entity_ids: data.ids,
				action: LogHistoryAction.DELETED,
			});

			res.locals.output.message(lang('mail-queue.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate<MailQueueValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

		const [entries, total] = await this.mailQueueService.findByFilter(data);

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

export function createMailQueueController(deps: {
	policy: PolicyAbstract;
	validator: MailQueueValidator;
	cache: CacheProvider;
	mailQueueService: MailQueueService;
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

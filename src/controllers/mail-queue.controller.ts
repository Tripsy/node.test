import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import MailQueueRepository, {MailQueueQuery} from '../repositories/mail-queue.repository';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import {getCacheProvider} from '../providers/cache.provider';
import MailQueuePolicy from '../policies/mail-queue.policy';
import MailQueueFindValidator from '../validators/mail-queue-find.validator';
import MailQueueDeleteValidator from '../validators/mail-queue-delete.validator';
import {logHistory} from '../helpers/subscriber.helper';
import {stringToDate} from '../helpers/date.helper';

class MailQueueController {
    public read = asyncHandler(async (req: Request, res: Response) => {
        const policy = new MailQueuePolicy(req);

        // Check permission (admin or operator with permission)
        policy.read();

        const cacheProvider = getCacheProvider();

        const cacheKey = cacheProvider.buildKey(MailQueueQuery.entityAlias, res.locals.validated.id, 'read');
        const mailQueue = await cacheProvider.get(cacheKey, async () => {
            return MailQueueRepository
                .createQuery()
                .filterById(res.locals.validated.id)
                .firstOrFail();
        });

        res.output.meta(cacheProvider.isCached, 'isCached');
        res.output.data(mailQueue);

        res.json(res.output);
    });

    public delete = asyncHandler(async (req: Request, res: Response) => {
        const policy = new MailQueuePolicy(req);

        // Check permission (admin or operator with permission)
        policy.delete();

        const validated = MailQueueDeleteValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const countDelete: number = await MailQueueRepository.createQuery()
            .filterBy('id', validated.data.ids, 'IN')
            .delete(false, true);

        if (countDelete === 0) {
            res.status(204).output.message(lang('error.db_delete_zero')); // Note: By API design the response message is actually not displayed for 204
        } else {
            logHistory(MailQueueQuery.entityAlias, 'deleted', {
                auth_id: policy.getUserId().toString()
            });

            res.output.message(lang('mail_queue.success.delete'));
        }

        res.json(res.output);
    });

    public find = asyncHandler(async (req: Request, res: Response) => {
        const policy = new MailQueuePolicy(req);

        // Check permission (admin or operator with permission)
        policy.find();

        // Validate the request body against the schema
        const validated = MailQueueFindValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const validatedSentDateStart = validated.data.filter.sent_date_start ? stringToDate(validated.data.filter.sent_date_start) : undefined;
        const validatedSentDateEnd = validated.data.filter.sent_date_end ? stringToDate(validated.data.filter.sent_date_end) : undefined;

        const [entries, total] = await MailQueueRepository.createQuery()
            .filterById(validated.data.filter.id)
            .filterBy('template_id', validated.data.filter.template_id)
            .filterByRange('sent_at', validatedSentDateStart, validatedSentDateEnd)
            .filterBy('status', validated.data.filter.status)
            .filterBy('content', validated.data.filter.content, 'LIKE')
            .filterBy('to', validated.data.filter.to, 'LIKE')
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
            query: validated.data
        });

        res.json(res.output);
    });
}

export default new MailQueueController();

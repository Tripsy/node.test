import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import CronHistoryRepository, {CronHistoryQuery} from '../repositories/cron-history.repository';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import {getCacheProvider} from '../providers/cache.provider';
import CronHistoryPolicy from '../policies/cron-history.policy';
import CronHistoryFindValidator from '../validators/cron-history-find.validator';
import CronHistoryDeleteValidator from '../validators/cron-history-delete.validator';
import {logHistory} from '../helpers/subscriber.helper';

class CronHistoryController {
    public read = asyncHandler(async (req: Request, res: Response) => {
        const policy = new CronHistoryPolicy(req);

        // Check permission (admin or operator with permission)
        policy.read();

        const cacheProvider = getCacheProvider();

        const cacheKey = cacheProvider.buildKey(CronHistoryQuery.entityAlias, res.locals.validated.id, 'read');
        const cronHistory = await cacheProvider.get(cacheKey, async () => {
            return CronHistoryRepository
                .createQuery()
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
                auth_id: policy.getUserId().toString()
            });

            res.output.message(lang('cron_history.success.delete'));
        }

        res.json(res.output);
    });

    public find = asyncHandler(async (req: Request, res: Response) => {
        const policy = new CronHistoryPolicy(req);

        // Check permission (admin or operator with permission)
        policy.find();

        // Validate the request body against the schema
        const validated = CronHistoryFindValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const validatedStartAtStart = validated.data.filter.start_at_start ? validated.data.filter.start_at_start + ' 00:00:00' : undefined;
        const validatedStartAtEnd = validated.data.filter.start_at_end ? validated.data.filter.start_at_end + ' 23:59:59' : undefined;

        const [entries, total] = await CronHistoryRepository.createQuery()
            .filterById(validated.data.filter.id)
            .filterByRange('created_at', validatedStartAtStart, validatedStartAtEnd)
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
            query: validated.data
        });

        res.json(res.output);
    });
}

export default new CronHistoryController();

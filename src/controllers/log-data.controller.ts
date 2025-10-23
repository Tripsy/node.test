import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import LogDataRepository, {LogDataQuery} from '../repositories/log-data.repository';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import {getCacheProvider} from '../providers/cache.provider';
import LogDataPolicy from '../policies/log-data.policy';
import LogDataFindValidator from '../validators/log-data-find.validator';
import LogDataDeleteValidator from '../validators/log-data-delete.validator';
import {logHistory} from '../helpers/subscriber.helper';

class LogDataController {
    public read = asyncHandler(async (req: Request, res: Response) => {
        const policy = new LogDataPolicy(req);

        // Check permission (admin or operator with permission)
        policy.read();

        const cacheProvider = getCacheProvider();

        const cacheKey = cacheProvider.buildKey(LogDataQuery.entityAlias, res.locals.validated.id, 'read');
        const logData = await cacheProvider.get(cacheKey, async () => {
            return LogDataRepository
                .createQuery()
                .filterById(res.locals.validated.id)
                .withDeleted(policy.allowDeleted())
                .firstOrFail();
        });

        res.output.meta(cacheProvider.isCached, 'isCached');
        res.output.data(logData);

        res.json(res.output);
    });

    public delete = asyncHandler(async (req: Request, res: Response) => {
        const policy = new LogDataPolicy(req);

        // Check permission (admin or operator with permission)
        policy.delete();

        const validated = LogDataDeleteValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const countDelete: number = await LogDataRepository.createQuery()
            .filterBy('id', validated.data.ids, 'IN')
            .delete(false, true);

        if (countDelete === 0) {
            res.status(204).output.message(lang('error.db_delete_zero')); // Note: By API design the response message is actually not displayed for 204
        } else {
            logHistory(LogDataQuery.entityAlias, 'deleted', {
                auth_id: policy.getUserId().toString()
            });

            res.output.message(lang('log_data.success.delete'));
        }

        res.json(res.output);
    });

    public find = asyncHandler(async (req: Request, res: Response) => {
        const policy = new LogDataPolicy(req);

        // Check permission (admin or operator with permission)
        policy.find();

        // Validate against the schema
        const validated = LogDataFindValidator.safeParse(req.query);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const validatedCreateDateStart = validated.data.filter.create_date_start ? validated.data.filter.create_date_start + ' 00:00:00' : undefined;
        const validatedCreateDateEnd = validated.data.filter.create_date_end ? validated.data.filter.create_date_end + ' 23:59:59' : undefined;

        const [entries, total] = await LogDataRepository.createQuery()
            .filterById(validated.data.filter.id)
            .filterBy('pid', validated.data.filter.pid)
            .filterByRange('created_at', validatedCreateDateStart, validatedCreateDateEnd)
            .filterBy('category', validated.data.filter.category)
            .filterBy('level', validated.data.filter.level)
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

export default new LogDataController();

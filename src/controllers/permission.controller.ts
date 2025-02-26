import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import PermissionRepository, {PermissionQuery} from '../repositories/permission.repository';
import PermissionEntity from '../entities/permission.entity';
import PermissionCreateValidator from '../validators/permission-create.validator';
import PermissionUpdateValidator from '../validators/permission-update.validator';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import CustomError from '../exceptions/custom.error';
import {cacheProvider} from '../providers/cache.provider';
import PermissionPolicy from '../policies/permission.policy';
import PermissionFindValidator from '../validators/permission-find.validator';

class PermissionController {
    public create = asyncHandler(async (req: Request, res: Response) => {
        const policy = new PermissionPolicy(req);

        // Check permission (admin or operator with permission)
        policy.create();

        // Validate the request body against the schema
        const validated = PermissionCreateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const existingPermission = await PermissionRepository.createQuery()
            .select(['id', 'entity', 'operation', 'deleted_at'])
            .filterBy('entity', validated.data.entity)
            .filterBy('operation', validated.data.operation)
            .withDeleted()
            .first();

        if (existingPermission) {
            if (existingPermission.deleted_at) {
                // Set `contextData` for usage in subscriber
                existingPermission.contextData = {
                    user_id: policy.getUserId()
                };

                await PermissionRepository.restore(existingPermission.id);

                res.output.data(existingPermission);
                res.output.message(lang('permission.success.restore'));
            } else {
                throw new CustomError(409, lang('permission.error.already_exists'));
            }
        } else {
            const permission = new PermissionEntity();
            permission.entity = validated.data.entity;
            permission.operation = validated.data.operation;

            // Set `contextData` for usage in subscriber
            permission.contextData = {
                user_id: policy.getUserId()
            };

            const entry: PermissionEntity = await PermissionRepository.save(permission);

            res.output.data(entry);
            res.output.message(lang('permission.success.create'));
        }

        res.json(res.output);
    });

    public read = asyncHandler(async (req: Request, res: Response) => {
        const policy = new PermissionPolicy(req);

        // Check permission (admin, operator with permission)
        policy.read();

        const cacheKey = cacheProvider.buildKey(PermissionQuery.entityAlias, res.locals.validatedId);
        const permission = await cacheProvider.get(cacheKey, async () => {
            return PermissionRepository
                .createQuery()
                .filterById(res.locals.validatedId)
                .withDeleted()
                .firstOrFail();
        });

        res.output.meta(cacheProvider.isCached, 'isCached');
        res.output.data(permission);

        res.json(res.output);
    });

    public update = asyncHandler(async (req: Request, res: Response) => {
        const policy = new PermissionPolicy(req);

        // Check permission (admin or operator with permission)
        policy.update();

        // Validate the request body against the schema
        const validated = PermissionUpdateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const existingPermission = await PermissionRepository.createQuery()
            .filterBy('id', res.locals.validatedId, '!=')
            .filterBy('entity', validated.data.entity)
            .filterBy('operation', validated.data.operation)
            .withDeleted()
            .first();

        if (existingPermission) {
            throw new CustomError(409, lang('permission.error.already_exists'));
        }

        const permission = await PermissionRepository.createQuery()
            .filterById(res.locals.validatedId)
            .firstOrFail();

        permission.entity = validated.data.entity;
        permission.operation = validated.data.operation;

        // Set `contextData` for usage in subscriber
        permission.contextData = {
            user_id: policy.getUserId()
        };

        await PermissionRepository.save(permission);

        res.output.message(lang('permission.success.update'));

        res.json(res.output);
    });

    public delete = asyncHandler(async (req: Request, res: Response) => {
        const policy = new PermissionPolicy(req);

        // Check permission (admin or operator with permission)
        policy.delete();

        await PermissionRepository.createQuery()
            .filterById(res.locals.validatedId)
            .delete();

        // // Set `contextData` for usage in subscriber
        // permission.contextData = {
        //     user_id: policy.getUserId()
        // }; ???

        res.output.message(lang('permission.success.delete'));

        res.json(res.output);
    });

    public find = asyncHandler(async (req: Request, res: Response) => {
        const policy = new PermissionPolicy(req);

        // Check permission (admin or operator with permission)
        policy.find();

        // Validate the request body against the schema
        const validated = PermissionFindValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const [entries, total] = await PermissionRepository.createQuery()
            .filterById(validated.data.filter.id)
            .filterBy('entity', validated.data.filter.entity, 'LIKE')
            .filterBy('operation', validated.data.filter.operation, 'LIKE')
            .withDeleted(validated.data.filter.isDeleted)
            .orderBy(validated.data.order_by, validated.data.direction)
            .pagination(validated.data.page, validated.data.limit)
            .all(true);

        res.output.data({
            entries: entries,
            pagination: {
                page: validated.data.page,
                limit: validated.data.limit,
                total: total,
                totalPages: Math.ceil(total / validated.data.limit)
            },
            query: validated.data
        });

        res.json(res.output);
    });
}

export default new PermissionController();

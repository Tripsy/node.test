import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import UserRepository, {UserQuery} from '../repositories/user.repository';
import UserEntity from '../entities/user.entity';
import UserCreateValidator from '../validators/user-create.validator';
import UserUpdateValidator, {paramsUpdateList} from '../validators/user-update.validator';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import CustomError from '../exceptions/custom.error';
import {getCacheProvider} from '../providers/cache.provider';
import UserFindValidator from '../validators/user-find.validator';
import {stringToDate} from '../helpers/utils.helper';
import UserPolicy from '../policies/user.policy';
import AccountTokenRepository from '../repositories/account-token.repository';

class UserController {
    public create = asyncHandler(async (req: Request, res: Response) => {
        const policy = new UserPolicy(req);

        // Check permission (admin or operator with permission)
        policy.create();

        // Validate the request body against the schema
        const validated = UserCreateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const existingUser = await UserRepository.createQuery()
            .filterByEmail(validated.data.email)
            .withDeleted(policy.allowDeleted())
            .first();

        if (existingUser) {
            throw new CustomError(409, lang('user.error.email_already_used'));
        }

        const user = new UserEntity();
        user.name = validated.data.name;
        user.email = validated.data.email;
        user.password = validated.data.password;
        user.status = validated.data.status;

        if (validated.data.language) {
            user.language = validated.data.language;
        }

        // Set `contextData` for usage in subscriber
        user.contextData = {
            auth_id: policy.getUserId()
        };

        const entry: UserEntity = await UserRepository.save(user);

        res.output.data(entry);
        res.output.message(lang('user.success.create'));

        res.status(201).json(res.output);
    });

    public read = asyncHandler(async (req: Request, res: Response) => {
        const policy = new UserPolicy(req);

        // Check permission (admin, operator with permission or owner)
        policy.read('user', req.user?.id);

        const cacheProvider = getCacheProvider();

        const cacheKey = cacheProvider.buildKey(UserQuery.entityAlias, res.locals.validated.id, 'read');
        const user = await cacheProvider.get(cacheKey, async () => {
            return UserRepository
                .createQuery()
                // .select(['id', 'name', 'email', 'status', 'created_at', 'updated_at'])
                // .addSelect(['password'])
                .filterById(res.locals.validated.id)
                .withDeleted(policy.allowDeleted())
                .firstOrFail();
        });

        res.output.meta(cacheProvider.isCached, 'isCached');
        res.output.data(user);

        res.json(res.output);
    });

    /**
     * This method lacks some safety measures regarding password & email update => no confirmation required from user side
     */
    public update = asyncHandler(async (req: Request, res: Response) => {
        const policy = new UserPolicy(req);

        // Check permission (admin or operator with permission)
        policy.update();

        // Validate the request body against the schema
        const validated = UserUpdateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const user = await UserRepository.createQuery()
            .select(paramsUpdateList)
            .filterById(res.locals.validated.id)
            .firstOrFail();

        const existingUser = await UserRepository.createQuery()
            .filterBy('id', res.locals.validated.id, '!=')
            .filterByEmail(validated.data.email)
            .first();

        // Return error if email already in use by another account
        if (existingUser) {
            throw new CustomError(409, lang('user.error.email_already_used'));
        }

        // Remove all account tokens
        if (validated.data.password || validated.data.email !== user.email) {
            await AccountTokenRepository.createQuery()
                .filterBy('user_id', user.id)
                .delete(false, true);
        }

        // Create a new object with only allowed fields
        const updatedUser: Partial<UserEntity> = {
            id: user.id
        };

        for (const key in validated.data) {
            // We allow update only for the fields used in the select
            if (paramsUpdateList.includes(key)) {
                (updatedUser as Record<string, any>)[key] = (validated.data as Record<string, any>)[key];
            }
        }

        // Set `contextData` for usage in subscriber
        updatedUser.contextData = {
            auth_id: policy.getUserId()
        };

        await UserRepository.save(updatedUser);

        res.output.message(lang('user.success.update'));
        res.output.data(user);

        res.json(res.output);
    });

    public delete = asyncHandler(async (req: Request, res: Response) => {
        const policy = new UserPolicy(req);

        // Check permission (admin or operator with permission)
        policy.delete();

        await UserRepository.createQuery()
            .filterById(res.locals.validated.id)
            .setContextData({
                auth_id: policy.getUserId()
            })
            .delete();

        res.output.message(lang('user.success.delete'));

        res.json(res.output);
    });

    public restore = asyncHandler(async (req: Request, res: Response) => {
        const policy = new UserPolicy(req);

        // Check permission (admin or operator with permission)
        policy.restore();

        await UserRepository.createQuery()
            .filterById(res.locals.validated.id)
            .setContextData({
                auth_id: policy.getUserId()
            })
            .restore();

        res.output.message(lang('user.success.restore'));

        res.json(res.output);
    });

    public find = asyncHandler(async (req: Request, res: Response) => {
        const policy = new UserPolicy(req);

        // Check permission (admin or operator with permission)
        // policy.find(); // TODO

        // Validate the request body against the schema
        const validated = UserFindValidator.safeParse(req.query);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const validatedCreateDateStart = validated.data.filter.create_date_start ? stringToDate(validated.data.filter.create_date_start) : undefined;
        const validatedCreateDateEnd = validated.data.filter.create_date_end ? stringToDate(validated.data.filter.create_date_end) : undefined;

        const [entries, total] = await UserRepository.createQuery()
            .filterById(validated.data.filter.id)
            .filterByTerm(validated.data.filter.term)
            .filterByStatus(validated.data.filter.status)
            .filterBy('role', validated.data.filter.role)
            .filterByRange('created_at', validatedCreateDateStart, validatedCreateDateEnd)
            // .withDeleted(policy.allowDeleted() && validated.data.filter.is_deleted)
            .withDeleted(validated.data.filter.is_deleted)
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

    public statusUpdate = asyncHandler(async (req: Request, res: Response) => {
        const policy = new UserPolicy(req);

        // Check permission (admin or operator with permission)
        policy.update();

        const user = await UserRepository.createQuery()
            .select(['id', 'status'])
            .filterById(res.locals.validated.id)
            .firstOrFail();

        if (user.status === res.locals.validated.status) {
            throw new BadRequestError(lang('user.error.status_unchanged', {
                status: res.locals.validated.status
            }));
        }

        user.status = res.locals.validated.status;

        // Set `contextData` for usage in subscriber
        user.contextData = {
            auth_id: policy.getUserId()
        };

        await UserRepository.save(user);

        res.output.message(lang('user.success.status_update'));

        res.json(res.output);
    });
}

export default new UserController();

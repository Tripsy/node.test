import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import UserRepository from '../repositories/user.repository';
import UserEntity from '../entities/user.entity';
import UserCreateValidator from '../validators/user-create.validator';
import UserUpdateValidator, {paramsUpdateList} from '../validators/user-update.validator';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import CustomError from '../exceptions/custom.error';
import {cacheProvider} from '../providers/cache.provider';
import UserFindValidator from '../validators/user-find.validator';
import {stringToDate} from '../helpers/formatter';

class UserController {
    public create = asyncHandler(async (req: Request, res: Response) => {
        // Validate the request body against the schema
        const validated = UserCreateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const existingUser = await UserRepository.createQuery()
            .filterByEmail(validated.data.email)
            .first();

        if (existingUser) {
            throw new CustomError(409, lang('user.error.email_already_used'));
        }

        const userEntity = new UserEntity();
        userEntity.name = validated.data.name;
        userEntity.email = validated.data.email;
        userEntity.password = validated.data.password;
        userEntity.status = validated.data.status;

        const user: UserEntity = await UserRepository.save(userEntity);

        res.output.data(user);
        res.output.message(lang('user.success.create'));

        res.json(res.output);
    });

    public read = asyncHandler(async (req: Request, res: Response) => {
        const cacheKey = cacheProvider.buildKey(UserRepository.entityAlias, res.locals.validatedId);
        const user = await cacheProvider.get(cacheKey, async () => {
            return UserRepository
                .createQuery()
                // .select(['id', 'name', 'email', 'status', 'created_at', 'updated_at'])
                // .addSelect(['password'])
                .filterById(res.locals.validatedId)
                .firstOrFail();
        });

        res.output.meta(cacheProvider.isCached, 'isCached');
        res.output.data(user);

        res.json(res.output);
    });

    public update = asyncHandler(async (req: Request, res: Response) => {
        // Validate the request body against the schema
        const validated = UserUpdateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const user = await UserRepository.createQuery()
            .select(paramsUpdateList)
            .filterById(res.locals.validatedId)
            .firstOrFail();

        for (const key in validated.data) {
            // We allow update only for the fields used in the select
            if (paramsUpdateList.includes(key)) {
                user[key] = (validated.data as Record<string, any>)[key];
            }
        }

        await UserRepository.save(user);

        res.output.message(lang('user.success.update'));

        res.json(res.output);
    });

    public delete = asyncHandler(async (req: Request, res: Response) => {
        await UserRepository.createQuery()
            .filterById(res.locals.validatedId)
            .softDelete();

        res.output.message(lang('user.success.delete'));

        res.json(res.output);
    });

    public find = asyncHandler(async (req: Request, res: Response) => {
        // Validate the request body against the schema
        const validated = UserFindValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const validatedCreateDateStart = validated.data.filter.create_date_start ? stringToDate(validated.data.filter.create_date_start) : undefined;
        const validatedCreateDateEnd = validated.data.filter.create_date_end ? stringToDate(validated.data.filter.create_date_end) : undefined;

        const [users, total] = await UserRepository.createQuery()
            .filterById(validated.data.filter.id)
            .filterBy('name', `%${validated.data.filter.name}%`, 'LIKE')
            .filterBy('email', `%${validated.data.filter.email}%`, 'LIKE')
            .filterByStatus(validated.data.filter.status)
            .filterByRange('created_at', validatedCreateDateStart, validatedCreateDateEnd)
            .orderBy(validated.data.order_by, validated.data.direction)
            .pagination(validated.data.page, validated.data.limit)
            // .consoleDebug()s
            .all(true);

        res.output.data({
            entries: users,
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

    public status = asyncHandler(async (req: Request, res: Response) => {
        const user = await UserRepository.createQuery()
            .select(['id', 'status'])
            .filterById(res.locals.validatedId)
            .firstOrFail();

        if (user.status === res.locals.validatedStatus) {
            throw new BadRequestError(lang('user.error.status_unchanged', {
                status: res.locals.validatedStatus
            }));
        }

        user.status = res.locals.validatedStatus;

        await UserRepository.save(user);

        res.output.message(lang('user.success.status'));

        res.json(res.output);
    });
}

export default new UserController();

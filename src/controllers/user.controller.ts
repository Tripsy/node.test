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

        const {
            password,
            created_at,
            updated_at,
            deleted_at,
            ...user
        } = await UserRepository.save(userEntity);

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
            if (user.hasOwnProperty(key)) {
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

        const users = await UserRepository.createQuery()
            .filterById(validated.data.filter.id)
            .getLike('name', validated.data.filter.name)
            .getLike('email', validated.data.filter.email)
            .filterByStatus(validated.data.filter.status)
            .all();
    //
    // .where('user.created_at >= :startDate', { startDate: '2024-01-01' })
    //         .andWhere('user.created_at <= :endDate', { endDate: '2024-12-31' })

        res.output.data({
            entries: users,
            query: validated.data
        });

        res.json(res.output);
    });

    public status = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id;
        const status = req.params.status;

        res.output.data('Set user #' + id + ' status to ' + status);

        res.json(res.output);
    });
}

export default new UserController();

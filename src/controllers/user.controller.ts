import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import UserRepository from '../repositories/user.repository';
import UserEntity from '../entities/user.entity';
import UserCreateValidator from '../validators/user-create.validator';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import CustomError from '../exceptions/custom.error';
import {cacheService} from '../services/cache.service';

export const Create = asyncHandler(async (req: Request, res: Response) => {
    // Validate the request body against the schema
    const validated = UserCreateValidator.safeParse(req.body);

    if (!validated.success) {
        res.output.errors(validated.error.errors);

        throw new BadRequestError();
    }

    const existingUser = await UserRepository.createReadQuery()
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

export const Read = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = cacheService.buildKey(UserRepository.entityAlias, res.locals.validatedId);
    const user = await cacheService.get(cacheKey, async () => {
        return UserRepository
            .createReadQuery()
            .select(['user.id', 'user.name', 'user.email', 'user.status', 'user.created_at', 'user.updated_at'])
            .filterById(res.locals.validatedId)
            .firstOrFail();
    });

    res.output.meta(cacheService.isCached, 'isCached');
    res.output.data(user);

    res.json(res.output);
});

export const Update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    res.output.data('Update user #' + id);

    res.json(res.output);
});

export const Delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    res.output.data('Delete user #' + id);

    res.json(res.output);
});

export const Find = asyncHandler(async (req: Request, res: Response) => {
    // Example: Fetch all users
    // const users: UserEntity[] = await userRepository.find();

    res.output.data('List users');

    res.json(res.output);
});

export const Status = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const status = req.params.status;

    res.output.data('Set user #' + id + ' status to ' + status);

    res.json(res.output);
});

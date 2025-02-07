import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import UserRepository from '../repositories/user.repository';
import UserEntity from '../entities/user.entity';
import UserCreateValidator from "../validators/user-create.validator";
import {lang} from '../config/i18n-setup.config';

export const Create = asyncHandler(async (req: Request, res: Response) => {
    // Validate the request body against the schema
    const validated = UserCreateValidator.safeParse(req.body);

    if (!validated.success) {
        res.status(400);
        res.output.errors(validated.error.errors);
        res.json(res.output);

        return;
    }

    const existingUser = await UserRepository.findByEmail(validated.data.email);

    if (existingUser) {
        res.status(409); // Conflict
        res.output.message(lang('user.error.email_already_used'));
        res.json(res.output);
    }

    const userEntity = new UserEntity();
    userEntity.name = validated.data.name;
    userEntity.email = validated.data.email;
    userEntity.password = validated.data.password;
    userEntity.status = validated.data.status;

    await UserRepository.save(userEntity);

    // return data + id
    // should I use CQRS?

    res.output.message(lang('user.success.create'));

    res.json(res.output);
});

export const Read = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    res.output.data('View user #' + id);

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

export const List = asyncHandler(async (req: Request, res: Response) => {
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

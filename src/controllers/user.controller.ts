import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import userRepository from '../repositories/user.repository';
import UserEntity from '../entities/user.entity';

export const Create = asyncHandler(async (req: Request, res: Response) => {
    res.output.data('Create user');

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

import {Router, Request, Response} from 'express';
import asyncHandler from './async.handler';
import userRepository from '../repositories/user.repository';
import UserEntity from '../entities/user.entity';

const indexRoutes: Router = Router();

indexRoutes.get('/', asyncHandler(async (req: Request, res: Response) => {

    // throw new Error('Async error!'); // Simulate an async error

    // Example: Fetch all users
    // const users: UserEntity[] = await userRepository.find();

    res.status(res.output.code(200)).json(
        res.output
            .success(true)
            .data({
                'sample': 'text',
                'and': 'more',
                'things': 'inside data'
            })
            .raw()
    );

    // res.status(res.output.code()).json(res.output.raw());
}));

export default indexRoutes;

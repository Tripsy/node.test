import {Router, Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import {lang} from '../config/i18n-setup.config';
const routes: Router = Router();

routes.get('/', asyncHandler(async (req: Request, res: Response) => {
    // throw new Error('Async error!'); // Simulate an async error

    // res.status(200); // The responseStatus code is by default 200

    // res.status(true); // The default value for success key is false; When responseStatus code is 200 force status to true (via raw())

    res.output.data({
        'lang': lang('user.validation.password_confirm_mismatch'),
        'sample': 'text',
        'and': 'more',
        'test': test,
    });

    // res.json(res.output.raw());
    // res.json(res.output.raw(false)); // Does not remove errors, data and meta keys even when they are empty
    res.json(res.output); // Based on toJSON() it automatically calls raw()
}));

export default routes;
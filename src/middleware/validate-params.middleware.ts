import { Request, Response, NextFunction } from 'express';
import BadRequestError from '../exceptions/bad-request.error';
import {lang} from '../config/i18n-setup.config';

export const validateParamsWhenId = (...args: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validated: Record<string, number> = {};

        for (const name of args) {
            const value = parseInt(req.params[name], 10);

            if (isNaN(value) || value <= 0) {
                throw new BadRequestError(lang('error.invalid_parameter', {name}));
            }

            validated[name] = value;
        }

        // Attach the validated IDs to the response object for later use
        res.locals.validated = validated;

        next(); // Proceed to the next middleware or route handler
    };
};

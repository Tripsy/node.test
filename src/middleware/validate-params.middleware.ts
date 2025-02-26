import { Request, Response, NextFunction } from 'express';
import BadRequestError from '../exceptions/bad-request.error';
import {lang} from '../config/i18n-setup.config';

export const validateParamsWhenId = (...args: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validated: Record<string, number> = {};
        const errors: Record<string, any>[] = [];

        for (const name of args) {
            const value = parseInt(req.params[name], 10);

            if (isNaN(value) || value <= 0) {
                errors.push({
                    [name]: lang('error.invalid_id', {name})
                });
            } else {
                validated[name] = value;
            }
        }

        if (errors.length > 0) {
            res.output.errors(errors)

            throw new BadRequestError();
        }

        // Attach the validated IDs to the response object for later use
        res.locals.validated = validated;

        next(); // Proceed to the next middleware or route handler
    };
};

export const validateParamsWhenStatus = (data: Record<string, any[]>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validated: Record<string, string> = {};
        const errors: Record<string, any>[] = [];

        for (const [name, allowedValues] of Object.entries(data)) {
            const value = req.params[name];

            if (!allowedValues.includes(value)) {
                errors.push({
                    [name]: lang('error.invalid_status', {
                        name: name,
                        allowedValues: allowedValues.join(', ')
                    })
                });
            } else {
                validated[name] = value;
            }
        }

        if (errors.length > 0) {
            res.output.errors(errors)

            throw new BadRequestError();
        }

        // Attach the validated IDs to the response object for later use
        res.locals.validated = validated;

        next(); // Proceed to the next middleware or route handler
    };
};
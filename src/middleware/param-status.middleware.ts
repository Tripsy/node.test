import { Request, Response, NextFunction } from 'express';
import BadRequestError from '../exceptions/bad-request.error';
import {lang} from '../config/i18n-setup.config';

const validateParamStatus = (allowedStatuses: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const status = req.params.status as string;

        if (!allowedStatuses.includes(status)) {
            throw new BadRequestError(lang('error.invalid_status', {
                allowedStatuses: allowedStatuses.join(', ')
            }));
        }

        // Attach the validated ID to the response object for later use
        res.locals.validatedStatus = status;

        next(); // Proceed to the next middleware or route handler
    };
};

export default validateParamStatus;

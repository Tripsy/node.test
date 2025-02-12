import { Request, Response, NextFunction } from 'express';
import BadRequestError from '../exceptions/bad-request.error';
import {lang} from '../config/i18n-setup.config';

const validateParamId = (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
        throw new BadRequestError(lang('error.invalid_id'));
    }

    // Attach the validated ID to the response object for later use
    res.locals.validatedId = id;

    next(); // Proceed to the next middleware or route handler
};

export default validateParamId;

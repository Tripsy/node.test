import { Request, Response, NextFunction } from 'express';
import CustomError from '../exceptions/custom.error';
import {systemLogger} from '../providers/logger.provider';
import {settings} from '../config/settings.config';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const status = err instanceof CustomError ? err.statusCode : 500;

    // Logging is disabled for certain response codes (ex: 400 - Bad Request, 409 - Conflict) when APP debug is false
    if (settings.app.debug || ![400, 409].includes(status)) {
        systemLogger.error(
            {
                err: err,
                request: {
                    method: req.method,
                    url: req.originalUrl,
                    body: req.body,
                    params: req.params,
                    query: req.query,
                },
            },
            `${err.name}: ${err.message}`
        );
    }

    // if (err instanceof NotFoundError || err instanceof NotAllowedError) {
    //
    // }

    res.status(status);
    res.output
        .message(err.message)

    res.json(res.output);
};

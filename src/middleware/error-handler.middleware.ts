import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.service';
import { childLogger } from '../helpers/log';
// import NotFoundError from '../exceptions/not-found.error';
// import NotAllowedError from '../exceptions/not-allowed.error';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const status = err.statusCode ?? 500;

    // Logging is disabled for certain response codes (ex: 409 - Conflict
    if (![409].includes(status)) {
        const systemLogger = childLogger(logger, 'system');

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
            err.name + ': ' + err.message
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

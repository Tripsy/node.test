import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.service';
import { childLogger } from '../helpers/log';
import NotFoundError from '../exceptions/not-found.error';
import NotAllowedError from '../exceptions/not-allowed.error';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const systemLogger = childLogger(logger, 'system');

    systemLogger.error(
        {
            errorInstance: err,
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

    if (err instanceof NotFoundError || err instanceof NotAllowedError) {
        res.output
            .success(false)
            .message(err.message)
            .code(err.statusCode);
    } else {
        res.output
            .success(false)
            .message(err.message)
            .code(500);
    }

    res.status(res.output.code()).json(res.output.raw());
};

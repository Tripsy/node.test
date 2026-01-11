import type { NextFunction, Request, Response } from 'express';
import { Configuration } from '@/config/settings.config';
import { CustomError } from '@/exceptions';
import { getSystemLogger } from '@/providers/logger.provider';

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	const status = err instanceof CustomError ? err.statusCode : 500;

	// Logging is disabled for certain response codes when APP debug is false
	if (
		!Configuration.isEnvironment('test') &&
		(Configuration.get('app.debug') ||
			![400, 401, 403, 404, 409].includes(status))
	) {
		if ([401].includes(status)) {
			getSystemLogger().warn(
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
				`${err.name}: ${err.message}`,
			);
		} else {
			getSystemLogger().error(
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
				`${err.name}: ${err.message}`,
			);
		}
	}

	// if (err instanceof NotFoundError || err instanceof NotAllowedError) {
	//
	// }

	res.status(status);
	res.locals.output.message(err.message);

	res.json(res.locals.output);
};

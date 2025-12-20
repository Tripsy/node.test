import type { NextFunction, Request, Response } from 'express';
import { getSystemLogger } from '@/lib/providers/logger.provider';

export const notFoundHandler = (
	req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	getSystemLogger().error(
		{
			request: {
				method: req.method,
				url: req.originalUrl,
			},
		},
		'Not Found',
	);

	res.locals.output.success(false).message('Not Found');

	res.status(404).json(res.locals.output);
};

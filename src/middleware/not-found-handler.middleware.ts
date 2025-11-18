import type { NextFunction, Request, Response } from 'express';
import { systemLogger } from '@/providers/logger.provider';

export const notFoundHandler = (
	req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	systemLogger.error(
		{
			request: {
				method: req.method,
				url: req.originalUrl,
			},
		},
		'Not Found',
	);

	res.output.success(false).message('Not Found');

	res.status(404).json(res.output);
};

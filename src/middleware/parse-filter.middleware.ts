import type { NextFunction, Request, Response } from 'express';

export const parseFilterMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { filter } = req.query;

	if (typeof filter === 'string' && filter.trim() !== '') {
		try {
			res.locals.filter = JSON.parse(filter);

			next();
		} catch {
			res.status(400).json(
				res.locals.output
					.success(false)
					.message('Invalid JSON in filter parameter'),
			);
		}
	} else {
		next();
	}
};

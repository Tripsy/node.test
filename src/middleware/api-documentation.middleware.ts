import type { NextFunction, Request, Response } from 'express';

export function apiDocumentationMiddleware(
	documentation: unknown,
) {
	return (_req: Request, res: Response, next: NextFunction) => {
		res.locals._documentation = documentation;

		next();
	};
}

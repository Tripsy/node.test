import type { NextFunction, Request, Response } from 'express';
import type { ApiOutputDocumentation } from '@/helpers/api-documentation.helper';

export function apiDocumentationMiddleware(
	documentation: ApiOutputDocumentation,
) {
	return (_req: Request, res: Response, next: NextFunction) => {
		res.locals._documentation = documentation;

		next();
	};
}

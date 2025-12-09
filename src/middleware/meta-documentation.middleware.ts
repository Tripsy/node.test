import type { NextFunction, Request, Response } from 'express';

function apiDocumentationUrl(...args: string[]): string {
	return `/api-docs/${args.join('/')}`;
}

function metaDocumentation(...args: string[]) {
	return (_req: Request, res: Response, next: NextFunction) => {
		res.locals._documentationUrl = apiDocumentationUrl(...args);

		next(); // Proceed to the next middleware or route handler
	};
}

export default metaDocumentation;

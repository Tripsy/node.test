import type { NextFunction, Request, Response } from 'express';

export function apiDocumentationUrl(...args: string[]): string {
    return `/api-docs/${args.join('/')}`;
}

export const metaDocumentation = (...args: string[]) => {
	return (_req: Request, res: Response, next: NextFunction) => {
		res.output.meta(apiDocumentationUrl(...args), 'documentationUrl');

		next(); // Proceed to the next middleware or route handler
	};
};

export default metaDocumentation;

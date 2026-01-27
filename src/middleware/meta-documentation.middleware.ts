import type { NextFunction, Request, Response } from 'express';

function metaDocumentation(documentation: unknown) {
	return (_req: Request, res: Response, next: NextFunction) => {
		res.locals._documentation = documentation;

		next(); // Proceed to the next middleware or route handler
	};
}

export default metaDocumentation;

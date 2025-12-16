import type { NextFunction, Request, Response } from 'express';
import { requestContext } from '@/config/request.context';

export function requestContextMiddleware(
	_req: Request,
	res: Response,
	next: NextFunction,
) {
	requestContext.run(
		{
			auth_id: res.locals.auth?.id,
			request_id: res.locals.request_id,
			language: res.locals.lang,
		},
		() => next(),
	);
}

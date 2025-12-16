import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
	auth_id?: number;
	request_id?: string;
	language?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextSource = 'cron' | 'api' | 'seed' | 'unknown';

export type RequestContext = {
	auth_id: number;
	performed_by: string;
	request_id: string;
	source: RequestContextSource;
	language: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

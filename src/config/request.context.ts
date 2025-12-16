import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
	auth_id: number;
	performed_by: string;
	request_id: string;
	source: 'cron' | 'api';
	language: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

import type { RequestHandler } from 'express';

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type RoutesDefinitionType<C> = {
	path: string;
	method: HttpMethod;
	action: keyof C;
	handlers?: RequestHandler[];
};

export type RoutesConfigType<C> = Record<string, RoutesDefinitionType<C>>;

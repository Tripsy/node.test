import { type RequestHandler, Router } from 'express';
import { getRoutesPath } from '@/config/routes.setup';
import { cfg } from '@/config/settings.config';
import { getObjectValue } from '@/helpers/objects.helper';
import metaDocumentation from '@/middleware/meta-documentation.middleware';
import type { RoutesConfigType } from '@/types/routing.type';

export function buildRoutes<C>({
	basePath,
	documentation,
	controller,
	routesConfig,
}: {
	basePath: string;
	documentation: string;
	controller: C;
	routesConfig: RoutesConfigType<C>;
}): Router {
	const router = Router();

	Object.entries(routesConfig).forEach(([_routeName, config]) => {
		const { path, method, action, handlers = [] } = config;

		const fullPath = `${basePath}${path}`;
		const middleware = [
			metaDocumentation(documentation, action as string),
			...handlers,
		];

		router[method](
			fullPath,
			...middleware,
			controller[action] as RequestHandler,
		);
	});

	return router;
}

export const extractRoutesPath = <C>(
	routes: RoutesConfigType<C>,
	basePath: string,
) =>
	Object.fromEntries(
		Object.entries(routes).map(([key, config]) => [
			key,
			`${basePath}${config.path}`,
		]),
	);

export function baseLink(): string {
	return cfg('app.url') as string;
}

export function routeLink(
	route: string,
	params?: Record<string, string | number>,
	isAbsolute = false,
): string {
	const routesPath = getRoutesPath();
	let routeLink = getObjectValue(routesPath, route) as string | undefined;

	if (!routeLink) {
		throw new Error(`Route ${route} not found`);
	}

	if (params) {
		Object.keys(params).forEach((key) => {
			routeLink = (routeLink as string).replace(
				`:${key}`,
				String(params[key]),
			);
		});
	}

	return isAbsolute ? `${baseLink()}${routeLink}` : routeLink;
}

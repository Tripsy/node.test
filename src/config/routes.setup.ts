import { type RequestHandler, Router } from 'express';
import { apiRateLimiter } from '@/config/rate-limit.config';
import { Configuration } from '@/config/settings.config';
import { buildSrcPath, listDirectories } from '@/helpers';
import metaDocumentation from '@/middleware/meta-documentation.middleware';
import { getSystemLogger } from '@/providers/logger.provider';
import type { RoutesConfigType } from '@/types/routing.type';

type ControllerType = Record<string, RequestHandler>;

type FeatureRoutesModule = {
	default: {
		basePath: string;
		documentation: string;
		controller: ControllerType;
		routesConfig: RoutesConfigType<ControllerType>;
	};
};

interface RouteInfo {
	name: string;
	method: string;
	path: string;
	action: string;
	description?: string;
}

function getRoutesFilePath(feature: string) {
	return buildSrcPath(
		Configuration.get('folder.features') as string,
		feature,
		`${feature}.routes`,
	);
}

function buildRoutes<C>({
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
		const middleware = [...handlers];

		// Check if any handler / middleware name ends with "RateLimiter"
		const hasRateLimiter = middleware.some((f) => {
			const functionName = f.name || '';

			return functionName.endsWith('RateLimiter');
		});

		if (!hasRateLimiter) {
			middleware.push(apiRateLimiter);
		}

		middleware.push(metaDocumentation(documentation, action as string));

		const resolvedController =
			typeof controller === 'function' ? controller() : controller;

		router[method](
			fullPath,
			...middleware,
			resolvedController[action] as RequestHandler,
		);
	});

	return router;
}

const allRoutesInfo: RouteInfo[] = [];

export function getRoutesInfo(): RouteInfo[] {
	return [...allRoutesInfo];
}

function pushRouteInfo(feature: string, def: FeatureRoutesModule['default']) {
	Object.entries(def.routesConfig).forEach(([routeName, config]) => {
		const fullPath = `${def.basePath}${config.path}`;

		allRoutesInfo.push({
			name: `${feature}.${routeName}`,
			method: config.method,
			path: fullPath,
			action: String(config.action),
		});
	});
}

export const initRoutes = async (apiPrefix: string = ''): Promise<Router> => {
	const router = Router();

	const featuresPath = buildSrcPath(
		Configuration.get('folder.features') as string,
	);
	const features = listDirectories(featuresPath);

	for (const feature of features) {
		try {
			const filePath = getRoutesFilePath(feature);
			const module = (await import(filePath)) as FeatureRoutesModule;
			const def = module.default;

			if (!def) {
				getSystemLogger().fatal(
					`Feature ${feature} does not export default routes config`,
				);
				continue;
			}

			router.use(apiPrefix, buildRoutes(def));

			if (!Configuration.isEnvironment('production')) {
				pushRouteInfo(feature, def);
			}
		} catch {
			// feature has no routes file → ignore
		}
	}

	return router;
};

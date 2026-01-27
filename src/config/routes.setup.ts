import { type RequestHandler, Router } from 'express';
import { apiRateLimiter } from '@/config/rate-limit.config';
import { Configuration } from '@/config/settings.config';
import { buildSrcPath, listDirectories } from '@/helpers';
import type {
	ApiOutputDocumentation,
	HttpMethod,
} from '@/helpers/api-documentation.helper';
import metaDocumentation from '@/middleware/meta-documentation.middleware';
import { getSystemLogger } from '@/providers/logger.provider';

type DocumentationType<C> = Record<keyof C, ApiOutputDocumentation>;

type RoutesType<C> = {
	[K in keyof C]: {
		path: string;
		method: HttpMethod;
		handlers?: RequestHandler[];
	};
};

export type FeatureRoutesModule<C> = {
	basePath: string;
	documentation?: DocumentationType<C>;
	controller: C;
	routes: RoutesType<C>;
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
	controller,
	routes,
	documentation,
}: {
	basePath: string;
	controller: C;
	routes: RoutesType<C>;
	documentation?: DocumentationType<C>;
}): Router {
	const router = Router();

	for (const action in routes) {
		const config = routes[action];
		const { path, method, handlers = [] } = config;

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

		if (Configuration.isEnvironment('development') && documentation) {
			middleware.push(metaDocumentation(documentation[action]));
		}

		router[method](
			fullPath,
			...middleware,
			controller[action] as RequestHandler,
		);
	}

	return router;
}

const allRoutesInfo: RouteInfo[] = [];

export function getRoutesInfo(): RouteInfo[] {
	return [...allRoutesInfo];
}

function pushRouteInfo<C>(feature: string, def: FeatureRoutesModule<C>) {
	for (const action in def.routes) {
		const config = def.routes[action];
		const fullPath = `${def.basePath}${config.path}`;

		allRoutesInfo.push({
			name: `${feature}.${action}`,
			method: config.method,
			path: fullPath,
			action: action,
		});
	}
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
			const module = await import(filePath);
			const def = module.default;

			if (!def) {
				getSystemLogger().fatal(
					`Feature ${feature} does not export default routes config`,
				);
				continue;
			}

			router.use(apiPrefix, buildRoutes(def));

			if (Configuration.isEnvironment('development')) {
				pushRouteInfo(feature, def);
			}
		} catch {
			// console.error(`Error importing ${feature}.routes:`, error);
			// feature has no routes file → ignore
		}
	}

	return router;
};

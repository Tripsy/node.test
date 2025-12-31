import fs from 'node:fs';
import { type RequestHandler, Router } from 'express';
import { cfg } from '@/config/settings.config';
import { buildSrcPath, getObjectValue } from '@/lib/helpers';
import metaDocumentation from '@/lib/middleware/meta-documentation.middleware';
import { getSystemLogger } from '@/lib/providers/logger.provider';
import type { RoutesConfigType } from '@/lib/types/routing.type';
import {apiRateLimiter} from "@/config/rate-limit.config";

const FEATURES_FOLDER = 'features';

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

function getFeatureFolders() {
	const featuresDir = buildSrcPath(FEATURES_FOLDER);

	return fs
		.readdirSync(featuresDir, { withFileTypes: true })
		.filter((f) => f.isDirectory())
		.map((f) => f.name);
}

function getRoutesFile(feature: string) {
	return buildSrcPath(FEATURES_FOLDER, feature, `${feature}.routes`);
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
		const middleware = [
			...handlers,
		];

        // Check if any handler / middleware name ends with "RateLimiter"
        const hasRateLimiter = middleware.some(f => {
            const functionName = f.name || '';

            return functionName.endsWith('RateLimiter');
        });

        if (!hasRateLimiter) {
            middleware.push(apiRateLimiter);
        }

        middleware.push(metaDocumentation(documentation, action as string));

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

// Used by `routeLink` helper
const cachedRoutesPath: Record<string, Record<string, string>> = {};

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
	const featureFolders = getFeatureFolders();

	for (const feature of featureFolders) {
		try {
			const routesFile = getRoutesFile(feature);
			const featureModule = (await import(
				routesFile
			)) as FeatureRoutesModule;

			const def = featureModule.default;

			if (!def) {
				getSystemLogger().fatal(
					`Feature ${feature} does not export default routes config`,
				);
				continue;
			}

			router.use(apiPrefix, buildRoutes(def));

			const key = feature.replace(/-/g, '');

			if (cachedRoutesPath[key]) {
				getSystemLogger().fatal(
					`Duplicate routes detected on "${feature}"`,
				);
				continue;
			}

			cachedRoutesPath[key] = extractRoutesPath(
				def.routesConfig,
				def.basePath,
			);

			if (cfg('app.env') !== 'production') {
				pushRouteInfo(feature, def);
			}
		} catch {
			// feature has no routes file → ignore
		}
	}

	return router;
};

export function getRoutesPath() {
	return cachedRoutesPath;
}

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

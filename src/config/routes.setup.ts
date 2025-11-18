import { type RequestHandler, Router } from 'express';
import { cfg } from '@/config/settings.config';
import accountRoutes, {
	accountRoutesBasePath,
	accountRoutesConfig,
} from '@/features/account/account.routes';
import cronHistoryRoutes, {
	cronHistoryRoutesBasePath,
	cronHistoryRoutesConfig,
} from '@/features/cron-history/cron-history.routes';
import logDataRoutes, {
	logDataRoutesBasePath,
	logDataRoutesConfig,
} from '@/features/log-data/log-data.routes';
import mailQueueRoutes, {
	mailQueueRoutesBasePath,
	mailQueueRoutesConfig,
} from '@/features/mail-queue/mail-queue.routes';
import permissionRoutes, {
	permissionRoutesBasePath,
	permissionRoutesConfig,
} from '@/features/permission/permission.routes';
import templateRoutes, {
	templateRoutesBasePath,
	templateRoutesConfig,
} from '@/features/template/template.routes';
import userRoutes, {
	userRoutesBasePath,
	userRoutesConfig,
} from '@/features/user/user.routes';
import userPermissionRoutes from '@/features/user-permission/user-permission.routes';
import { getObjectValue } from '@/helpers/utils.helper';
import metaDocumentation from '@/middleware/meta-documentation.middleware';

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type RoutesDefinitionType<C> = {
	path: string;
	method: HttpMethod;
	action: keyof C;
	handlers?: RequestHandler[];
};

export type RoutesConfigType<C> = Record<string, RoutesDefinitionType<C>>;

export const initRoutes = (): Router => {
	const router = Router();

	router.use(accountRoutes);
	router.use(cronHistoryRoutes);
	router.use(logDataRoutes);
	router.use(mailQueueRoutes);
	router.use(permissionRoutes);
	router.use(templateRoutes);
	router.use(userRoutes);
	router.use(userPermissionRoutes);

	return router;
};

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

export function buildRoutes<C>(
	router: Router,
	controller: C,
	namespace: string,
	routesConfig: RoutesConfigType<C>,
	basePath: string = '',
): void {
	Object.entries(routesConfig).forEach(([_routeName, config]) => {
		const { path, method, action, handlers = [] } = config;

		const fullPath = `${basePath}${path}`;
		const middleware = [
			metaDocumentation(namespace, action as string),
			...handlers,
		];

		router[method](
			fullPath,
			...middleware,
			controller[action] as RequestHandler,
		);
	});
}

export function baseLink(): string {
	return cfg('app.url') as string;
}

const routesPath = {
	account: extractRoutesPath(accountRoutesConfig, accountRoutesBasePath),
	cronHistory: extractRoutesPath(
		cronHistoryRoutesConfig,
		cronHistoryRoutesBasePath,
	),
	logData: extractRoutesPath(logDataRoutesConfig, logDataRoutesBasePath),
	mailQueue: extractRoutesPath(
		mailQueueRoutesConfig,
		mailQueueRoutesBasePath,
	),
	permission: extractRoutesPath(
		permissionRoutesConfig,
		permissionRoutesBasePath,
	),
	template: extractRoutesPath(templateRoutesConfig, templateRoutesBasePath),
	user: extractRoutesPath(userRoutesConfig, userRoutesBasePath),
};

export function routeLink(
	route: string,
	params?: Record<string, string | number>,
	isAbsolute = false,
): string {
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

import {RequestHandler, Router} from 'express';
import metaDocumentation from "@/middleware/meta-documentation.middleware";
import {cfg} from "@/config/settings.config";
import {getObjectValue} from "@/helpers/utils.helper";
import accountRoutes, {accountRoutesConfig} from "@/features/account/account.routes";
import cronHistoryRoutes, {cronHistoryRoutesConfig} from "@/features/cron-history/cron-history.routes";
import userRoutes, {userRoutesConfig} from '@/features/user/user.routes';
import logDataRoutes, {logDataRoutesConfig} from "@/features/log-data/log-data.routes";
import mailQueueRoutes, {mailQueueRoutesConfig} from "@/features/mail-queue/mail-queue.routes";
import permissionRoutes, {permissionRoutesConfig} from "@/features/permission/permission.routes";
import templateRoutes, {templateRoutesConfig} from "@/features/template/template.routes";

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
    // router.use('', templateRoutes);

	return router;
};

export const extractRoutesPath = <C>(routes: RoutesConfigType<C>, basePath: string) => Object.fromEntries(
    Object.entries(routes).map(([key, config]) => [
        key,
        `${basePath}${config.path}`
    ])
)

export function buildRoutes<C>(
    router: Router,
    controller: C,
    routesConfig: RoutesConfigType<C>,
    basePath: string = ''
): void {
    Object.entries(routesConfig).forEach(([routeName, config]) => {
        const { path, method, action, handlers = [] } = config;

        const fullPath = `${basePath}${path}`;
        const middleware = [
            metaDocumentation(routeName, action as string),
            ...handlers
        ];

        router[method](fullPath, ...middleware, controller[action] as RequestHandler);
    });
}

export function baseLink(): string {
    return cfg('app.url') as string;
}

const routesPath = {
    account: extractRoutesPath(accountRoutesConfig, '/account'),
    cronHistory: extractRoutesPath(cronHistoryRoutesConfig, '/cron-history'),
    logData: extractRoutesPath(logDataRoutesConfig, '/log-data'),
    mailQueue: extractRoutesPath(mailQueueRoutesConfig, '/mail-queue'),
    permission: extractRoutesPath(permissionRoutesConfig, '/permissions'),
    template: extractRoutesPath(templateRoutesConfig, '/templates'),
    user: extractRoutesPath(userRoutesConfig, '/users'),
}

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

import {Router} from 'express';
import {buildSrcPath} from '../helpers/system.helper';
import fs from 'fs/promises';
import {settings} from './settings.config';
import {getObjectValue} from '../helpers/utils.helper';

export const routesConfig = {
    user: {
        create: '/users',
        read: '/users/:id',
        update: '/users/:id',
        delete: '/users/:id',
        find: '/users',
        updateStatus: '/users/:id/status/:status',
    },
    account: {
        register: '/account/register',
        login: '/account/login',
        removeToken: '/account/token',
        logout: '/account/logout',
        passwordRecover: '/account/password-recover',
        passwordRecoverChange: '/account/password-recover-change/:ident',
        passwordUpdate: '/account/password-update',
        emailConfirm: '/account/email-confirm/:token',
        emailUpdate: '/account/email-update',
    },
    permission: {
        create: '/permissions',
        read: '/permissions/:id',
        update: '/permissions/:id',
        delete: '/permissions/:id',
        find: '/permissions',
    },
    userPermission : {
        create: '/users/:userId/permissions',
        update: '/users/:userId/permissions/:id',
        delete: '/users/:userId/permissions/:id',
        find: '/users/:userId/permissions'
    }
};

export function baseLink(): string {
    return settings.app.url;
}

export function routeLink(route: string, params?: Record<string, string>, isAbsolute = false): string {
    let resolvedRoute = getObjectValue(routesConfig, route);

    if (!resolvedRoute) {
        throw new Error(`Route ${route} not found`);
    }

    if (params) {
        Object.keys(params).forEach((key) => {
            resolvedRoute = resolvedRoute.replace(`:${key}`, params[key]);
        });
    }

    return isAbsolute ? `${baseLink()}${resolvedRoute}` : resolvedRoute;
}


const router: Router = Router();

const loadRoutes = async (router: Router): Promise<void> => {
    const routesDir = buildSrcPath('routes');
    const files = await fs.readdir(routesDir);

    // Filter files that end with '.routes.ts'
    const routeFiles = files.filter((file) => file.endsWith('.routes.ts'));

    if (routeFiles.length === 0) {
        throw Error('No route files found');
    }

    // Load all route modules in parallel
    await Promise.all(
        routeFiles.map(async (file) => {
            const routeModule = await import(buildSrcPath('routes', file));

            if (typeof routeModule.default === 'function') {
                router.use('/', routeModule.default);
            } else {
                throw new Error(`${file} does not export a valid router.`);
            }
        })
    );
};

// Load routes dynamically and export the router
export const initRoutes = async (): Promise<Router> => {
    try {
        await loadRoutes(router);
        return router;
    } catch (error) {
        throw error;
    }
};

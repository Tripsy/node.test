import fs from 'node:fs/promises';
import { Router } from 'express';
import { cfg } from '@/config/settings.config';
import { buildSrcPath } from '@/helpers/system.helper';
import { getObjectValue } from '@/helpers/utils.helper';

export const routesConfig = {
	user: {
		create: '/users',
		read: '/users/:id',
		update: '/users/:id',
		delete: '/users/:id',
		restore: '/users/:id/restore',
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
		details: '/account/details',
	},
	permission: {
		create: '/permissions',
		read: '/permissions/:id',
		update: '/permissions/:id',
		delete: '/permissions/:id',
		restore: '/permissions/:id/restore',
		find: '/permissions',
	},
	userPermission: {
		create: '/users/:user_id/permissions',
		delete: '/users/:user_id/permissions/:permission_id',
		restore: '/users/:user_id/permissions/:id/restore',
		find: '/users/:user_id/permissions',
	},
	template: {
		create: '/templates',
		read: '/templates/:id',
		update: '/templates/:id',
		delete: '/templates/:id',
		restore: '/templates/:id/restore',
		find: '/templates',
	},
	logData: {
		read: '/log-data/:id',
		delete: '/log-data',
		find: '/log-data',
	},
	cronHistory: {
		read: '/cron-history/:id',
		delete: '/cron-history',
		find: '/cron-history',
	},
	mailQueue: {
		read: '/mail-queue/:id',
		delete: '/mail-queue',
		find: '/mail-queue',
	},
};

export function baseLink(): string {
	return cfg('app.url') as string;
}

export function routeLink(
	route: string,
	params?: Record<string, string | number>,
	isAbsolute = false,
): string {
	let routeLink = getObjectValue(routesConfig, route) as string | undefined;

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

const router: Router = Router();

//TODO /routes doesn't exist anymore
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
		}),
	);
};

// Load routes dynamically and export the router
export const initRoutes = async (): Promise<Router> => {
	await loadRoutes(router);

	return router;
};

import { Router } from 'express';
import { buildRoutes, type RoutesConfigType } from '@/config/routes.setup';
import CronHistoryController from '@/features/cron-history/cron-history.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

export const cronHistoryRoutesBasePath: string = '/cron-history';
export const cronHistoryRoutesConfig: RoutesConfigType<
	typeof CronHistoryController
> = {
	read: {
		path: '/:id',
		method: 'get',
		action: 'read',
		handlers: [validateParamsWhenId('id')],
	},
	delete: {
		path: '/:id',
		method: 'delete',
		action: 'delete',
		handlers: [validateParamsWhenId('id')],
	},
	find: {
		path: '',
		method: 'get',
		action: 'find',
	},
};

const routes: Router = Router();

buildRoutes(
	routes,
	CronHistoryController,
	'cron-history',
	cronHistoryRoutesConfig,
	cronHistoryRoutesBasePath,
);

export default routes;

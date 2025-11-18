import { Router } from 'express';
import { buildRoutes, type RoutesConfigType } from '@/config/routes.setup';
import MailQueueController from '@/features/mail-queue/mail-queue.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

export const mailQueueRoutesBasePath: string = '/mail-queue';
export const mailQueueRoutesConfig: RoutesConfigType<
	typeof MailQueueController
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
	MailQueueController,
	'mail-queue',
	mailQueueRoutesConfig,
	mailQueueRoutesBasePath,
);

export default routes;

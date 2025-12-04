import { Router } from 'express';
import { buildRoutes, type RoutesConfigType } from '@/config/routes.setup';
import ClientController from '@/features/client/client.controller';
import {
	validateParamsWhenId,
	validateParamsWhenStatus,
} from '@/middleware/validate-params.middleware';

export const clientRoutesBasePath: string = '/clients';
export const clientRoutesConfig: RoutesConfigType<typeof ClientController> = {
	create: {
		path: '',
		method: 'post',
		action: 'create',
	},
	read: {
		path: '/:id',
		method: 'get',
		action: 'read',
		handlers: [validateParamsWhenId('id')],
	},
	update: {
		path: '/:id',
		method: 'put',
		action: 'update',
		handlers: [validateParamsWhenId('id')],
	},
	delete: {
		path: '/:id',
		method: 'delete',
		action: 'delete',
		handlers: [validateParamsWhenId('id')],
	},
	restore: {
		path: '/:id/restore',
		method: 'patch',
		action: 'restore',
		handlers: [validateParamsWhenId('id')],
	},
	find: {
		path: '',
		method: 'get',
		action: 'find',
	},
	'update-status': {
		path: '/:id/status/:status',
		method: 'patch',
		action: 'statusUpdate',
		handlers: [
			validateParamsWhenId('id'),
			validateParamsWhenStatus({
				status: [ClientStatusEnum.ACTIVE, ClientStatusEnum.INACTIVE],
			}),
		],
	},
};

const routes: Router = Router();

buildRoutes(
	routes,
	ClientController,
	'clients',
	clientRoutesConfig,
	clientRoutesBasePath,
);

export default routes;

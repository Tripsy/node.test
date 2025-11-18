import { Router } from 'express';
import { buildRoutes, type RoutesConfigType } from '@/config/routes.setup';
import UserController from '@/features/user/user.controller';
import { UserStatusEnum } from '@/features/user/user-status.enum';
import {
	validateParamsWhenId,
	validateParamsWhenStatus,
} from '@/middleware/validate-params.middleware';

export const userRoutesBasePath: string = '/users';
export const userRoutesConfig: RoutesConfigType<typeof UserController> = {
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
		method: 'post',
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
				status: [UserStatusEnum.ACTIVE, UserStatusEnum.INACTIVE],
			}),
		],
	},
};

const routes: Router = Router();

buildRoutes(
	routes,
	UserController,
	'users',
	userRoutesConfig,
	userRoutesBasePath,
);

export default routes;

import { Router } from 'express';
import { buildRoutes, type RoutesConfigType } from '@/config/routes.setup';
import UserPermissionController from '@/features/user-permission/user-permission.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const userPermissionRoutesBasePath: string = '/users';
export const userPermissionRoutesConfig: RoutesConfigType<
	typeof UserPermissionController
> = {
	create: {
		path: '/:user_id/permissions',
		method: 'post',
		action: 'create',
		handlers: [validateParamsWhenId('user_id')],
	},
	delete: {
		path: '/:user_id/permissions/:permission_id',
		method: 'delete',
		action: 'delete',
		handlers: [validateParamsWhenId('user_id', 'permission_id')],
	},
	restore: {
		path: '/:user_id/permissions/:id/restore',
		method: 'patch',
		action: 'restore',
		handlers: [validateParamsWhenId('user_id', 'id')],
	},
	find: {
		path: '/:user_id/permissions',
		method: 'get',
		action: 'find',
		handlers: [validateParamsWhenId('user_id')],
	},
};

const routes: Router = Router();

buildRoutes(
	routes,
	UserPermissionController,
	'user-permission',
	userPermissionRoutesConfig,
	userPermissionRoutesBasePath,
);

export default routes;

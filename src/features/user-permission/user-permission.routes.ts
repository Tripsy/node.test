import UserPermissionController from '@/features/user-permission/user-permission.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/types/routing.type';

export default {
	basePath: '/users',
	documentation: 'user-permission',
	controller: UserPermissionController,
	routesConfig: {
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
	} as RoutesConfigType<typeof UserPermissionController>,
};

import {categoryController} from '@/features/category/category.controller';
import { CategoryStatusEnum } from '@/features/category/category.entity';
import {
	validateParamsWhenId,
	validateParamsWhenStatus,
} from '@/lib/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/lib/types/routing.type';

export default {
	basePath: '/categories',
	documentation: 'categories',
	controller: categoryController,
	routesConfig: {
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
					status: [
						CategoryStatusEnum.ACTIVE,
						CategoryStatusEnum.INACTIVE,
					],
				}),
			],
		},
	} as RoutesConfigType<typeof categoryController>,
};

import { discountController } from '@/features/discount/discount.controller';
import { validateParamsWhenId } from '@/lib/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/lib/types/routing.type';

export default {
	basePath: '/discounts',
	documentation: 'discounts',
	controller: discountController,
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
	} as RoutesConfigType<typeof discountController>,
};

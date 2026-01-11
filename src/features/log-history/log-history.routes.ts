import { logHistoryController } from '@/features/log-history/log-history.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/types/routing.type';

export default {
	basePath: '/log-history',
	documentation: 'log-history',
	controller: logHistoryController,
	routesConfig: {
		read: {
			path: '/:id',
			method: 'get',
			action: 'read',
			handlers: [validateParamsWhenId('id')],
		},
		delete: {
			path: '',
			method: 'delete',
			action: 'delete',
		},
		find: {
			path: '',
			method: 'get',
			action: 'find',
		},
	} as RoutesConfigType<typeof logHistoryController>,
};

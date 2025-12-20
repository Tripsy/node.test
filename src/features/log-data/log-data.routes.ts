import LogDataController from '@/features/log-data/log-data.controller';
import { validateParamsWhenId } from '@/lib/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/lib/types/routing.type';

export default {
	basePath: '/log-data',
	documentation: 'log-data',
	controller: LogDataController,
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
	} as RoutesConfigType<typeof LogDataController>,
};

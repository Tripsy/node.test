import { logDataController } from '@/features/log-data/log-data.controller';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/types/routing.type';

export default {
	basePath: '/log-data',
	documentation: 'log-data',
	controller: logDataController,
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
			handlers: [parseFilterMiddleware],
		},
	} as RoutesConfigType<typeof logDataController>,
};

import { placeController } from '@/features/place/place.controller';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import {
	validateParamsWhenId,
	validateParamsWhenString,
} from '@/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/types/routing.type';

export default {
	basePath: '/places',
	documentation: 'places',
	controller: placeController,
	routesConfig: {
		create: {
			path: '',
			method: 'post',
			action: 'create',
		},
		read: {
			path: '/:id/:language',
			method: 'get',
			action: 'read',
			handlers: [
				validateParamsWhenId('id'),
				validateParamsWhenString('language'),
			],
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
			handlers: [parseFilterMiddleware],
		},
	} as RoutesConfigType<typeof placeController>,
};

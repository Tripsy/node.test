import PlaceController from '@/features/place/place.controller';
import {
	validateParamsWhenId,
	validateParamsWhenString,
} from '@/lib/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/lib/types/routing.type';

export default {
	basePath: '/places',
	documentation: 'places',
	controller: PlaceController,
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
		},
	} as RoutesConfigType<typeof PlaceController>,
};

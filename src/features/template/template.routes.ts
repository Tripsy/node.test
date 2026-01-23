import { templateController } from '@/features/template/template.controller';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import {
	validateParamsWhenId,
	validateParamsWhenString,
} from '@/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/types/routing.type';

export default {
	basePath: '/templates',
	documentation: 'templates',
	controller: templateController,
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
		'read-page': {
			path: '/:label/page',
			method: 'get',
			action: 'readPage',
			handlers: [validateParamsWhenString('label')],
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
	} as RoutesConfigType<typeof templateController>,
};

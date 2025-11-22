import { Router } from 'express';
import { buildRoutes, type RoutesConfigType } from '@/config/routes.setup';
import TemplateController from '@/features/template/template.controller';
import {
	validateParamsWhenId,
	validateParamsWhenString,
} from '@/middleware/validate-params.middleware';

export const templateRoutesBasePath: string = '/templates';
export const templateRoutesConfig: RoutesConfigType<typeof TemplateController> =
	{
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
		},
	};

const routes: Router = Router();

buildRoutes(
	routes,
	TemplateController,
	'templates',
	templateRoutesConfig,
	templateRoutesBasePath,
);

export default routes;

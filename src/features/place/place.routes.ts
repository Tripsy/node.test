import type { FeatureRoutesModule } from '@/config/routes.setup';
import { placeController } from '@/features/place/place.controller';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import {
	validateParamsWhenId,
	validateParamsWhenString,
} from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof placeController> = {
	basePath: '/places',
	controller: placeController,
	routes: {
		create: {
			path: '',
			method: 'post',
		},
		read: {
			path: '/:id/:language',
			method: 'get',
			handlers: [
				validateParamsWhenId('id'),
				validateParamsWhenString('language'),
			],
		},
		update: {
			path: '/:id',
			method: 'put',
			handlers: [validateParamsWhenId('id')],
		},
		delete: {
			path: '/:id',
			method: 'delete',
			handlers: [validateParamsWhenId('id')],
		},
		restore: {
			path: '/:id/restore',
			method: 'patch',
			handlers: [validateParamsWhenId('id')],
		},
		find: {
			path: '',
			method: 'get',
			handlers: [parseFilterMiddleware],
		},
	},
};

const routesConfiguration: FeatureRoutesModule<typeof placeController> = {
	...routesModule,
};

export default routesConfiguration;

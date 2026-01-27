import type { FeatureRoutesModule } from '@/config/routes.setup';
import { logDataController } from '@/features/log-data/log-data.controller';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof logDataController> = {
	basePath: '/log-data',
	controller: logDataController,
	routes: {
		read: {
			path: '/:id',
			method: 'get',
			handlers: [validateParamsWhenId('id')],
		},
		delete: {
			path: '',
			method: 'delete',
		},
		find: {
			path: '',
			method: 'get',
			handlers: [parseFilterMiddleware],
		},
	},
};

const routesConfiguration: FeatureRoutesModule<typeof logDataController> = {
	...routesModule,
};

export default routesConfiguration;

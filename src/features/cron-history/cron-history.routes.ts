import type { FeatureRoutesModule } from '@/config/routes.setup';
import { cronHistoryController } from '@/features/cron-history/cron-history.controller';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof cronHistoryController> = {
	basePath: '/cron-history',
	controller: cronHistoryController,
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

const routesConfiguration: FeatureRoutesModule<typeof cronHistoryController> = {
	...routesModule,
};

export default routesConfiguration;

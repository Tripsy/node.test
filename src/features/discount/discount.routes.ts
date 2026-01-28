import type { FeatureRoutesModule } from '@/config/routes.setup';
import { discountController } from '@/features/discount/discount.controller';
import { setupDevelopmentDocumentation } from '@/helpers/api-documentation.helper';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof discountController> = {
	basePath: '/discounts',
	controller: discountController,
	routes: {
		create: {
			path: '',
			method: 'post',
		},
		read: {
			path: '/:id',
			method: 'get',
			handlers: [validateParamsWhenId('id')],
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

const routesConfiguration = await setupDevelopmentDocumentation(
	routesModule,
	'@/features/discount/discount.docs',
);

export default routesConfiguration;

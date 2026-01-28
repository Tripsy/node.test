import type { FeatureRoutesModule } from '@/config/routes.setup';
import { discountController } from '@/features/discount/discount.controller';
import {docs} from '@/features/discount/discount.docs';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import {generateDocumentation} from "@/helpers/api-documentation.helper";

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

// TODO make sure is only only working for development environment -> maybe move it directly to routes.setu
const routesConfiguration: FeatureRoutesModule<typeof discountController> = {
	...routesModule,
	documentation: generateDocumentation(routesModule, docs),
};

export default routesConfiguration;

import type { FeatureRoutesModule } from '@/config/routes.setup';
import { Configuration } from '@/config/settings.config';
import { discountController } from '@/features/discount/discount.controller';
import { apiDocumentationMiddleware } from '@/middleware/api-documentation.middleware';
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

const routesConfiguration = { ...routesModule };

if (Configuration.isEnvironment('development')) {
	const getDocs = async () => {
		try {
			const { generateDocumentation } = await import(
				'@/helpers/api-documentation.helper'
			);
			const { docs } = await import('@/features/discount/discount.docs');

			return generateDocumentation(routesModule, docs);
		} catch {
			// Feature has no documentation → ignore
		}
	};

	const documentation = await getDocs();

	if (documentation) {
		routesConfiguration.routes = Object.entries(routesModule.routes).reduce(
			(acc, [action, route]) => {
				const routeAction = action as keyof typeof routesModule.routes;

				acc[routeAction] = {
					...route,
					handlers: [
						...(route.handlers || []),
						apiDocumentationMiddleware(documentation[routeAction]),
					],
				};

				return acc;
			},
			{} as typeof routesModule.routes,
		);
	}
}

export default routesConfiguration;

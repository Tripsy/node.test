import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { productCategoryAttributeController } = await import(
		'@/features/product/product-category-attribute.controller'
	);

	const config: FeatureRoutesModule<
		typeof productCategoryAttributeController
	> = {
		basePath: '/product-category-attributes',
		controller: productCategoryAttributeController,
		routes: {
			create: {
				path: '',
				method: 'post',
			},
			// Ahead of `/:id`, or Express matches the literal against the id parameter and the
			// param validator rejects it before this handler is ever reached
			resolve: {
				path: '/resolve',
				method: 'get',
			},
			// A literal too, and declared here for the same reason as `resolve` above
			orderUpdate: {
				path: '/order',
				method: 'patch',
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
			},
		},
	};

	return config;
};

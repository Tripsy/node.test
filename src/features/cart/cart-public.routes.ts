import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { cartPublicController } = await import(
		'@/features/cart/cart-public.controller'
	);

	const config: FeatureRoutesModule<typeof cartPublicController> = {
		basePath: '/public/cart',
		controller: cartPublicController,
		/*
		 * Singular and unparameterized: a caller has exactly one cart, named by the
		 * `X-Cart-Token` header or by their account, never by an id in the path. An `/:id`
		 * route would have to be checked against the caller afterwards, and getting that
		 * check wrong opens every cart in the table.
		 *
		 * The line ids in the item routes are safe for the opposite reason - they are only
		 * ever resolved within the cart the caller already proved they hold.
		 */
		routes: {
			read: {
				path: '',
				method: 'get',
			},
			addItem: {
				path: '/items',
				method: 'post',
			},
			updateItem: {
				path: '/items/:id',
				method: 'put',
				handlers: [validateParamsWhenId('id')],
			},
			removeItem: {
				path: '/items/:id',
				method: 'delete',
				handlers: [validateParamsWhenId('id')],
			},
			clear: {
				path: '',
				method: 'delete',
			},
			setCurrency: {
				path: '/currency',
				method: 'patch',
			},
			checkout: {
				path: '/checkout',
				method: 'post',
			},
		},
	};

	return config;
};

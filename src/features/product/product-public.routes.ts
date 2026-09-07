import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { productPublicController } = await import(
		'@/features/product/product-public.controller'
	);

	const config: FeatureRoutesModule<typeof productPublicController> = {
		basePath: '/public/products',
		controller: productPublicController,
		routes: {
			find: {
				path: '',
				method: 'get',
			},
			read: {
				path: '/:slug',
				method: 'get',
			},
		},
	};

	return config;
};

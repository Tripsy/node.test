import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { productVariantController } = await import(
		'@/features/product/product-variant.controller'
	);

	/*
	 * `find` and nothing else. A variant is created, edited and withdrawn through its product -
	 * `syncVariants` replaces the set as a whole - so a write route here would be a second way to
	 * change the same rows, with none of the set-wide rules the product validator enforces.
	 */
	const config: FeatureRoutesModule<typeof productVariantController> = {
		basePath: '/product-variants',
		controller: productVariantController,
		routes: {
			find: {
				path: '',
				method: 'get',
			},
		},
	};

	return config;
};

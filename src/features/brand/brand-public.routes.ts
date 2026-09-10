import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { brandPublicController } = await import(
		'@/features/brand/brand-public.controller'
	);

	const config: FeatureRoutesModule<typeof brandPublicController> = {
		basePath: '/public/brands',
		controller: brandPublicController,
		routes: {
			find: {
				path: '',
				method: 'get',
			},
		},
	};

	return config;
};

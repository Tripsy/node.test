import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { reviewPublicController } = await import(
		'@/features/review/review-public.controller'
	);

	const config: FeatureRoutesModule<typeof reviewPublicController> = {
		basePath: '/public/reviews',
		controller: reviewPublicController,
		routes: {
			create: {
				path: '',
				method: 'post',
			},
			/*
			 * The product addresses the row together with the account behind the request -
			 * one live review per buyer per product, by `UQ_review_user`. An `/:id` route
			 * would have to be checked against the caller afterwards, and getting that check
			 * wrong lets anyone rewrite anyone's review; the id is not the caller's to name.
			 * Both writes below are addressed this way for that reason.
			 */
			update: {
				path: '/:product_id',
				method: 'put',
				handlers: [validateParamsWhenId('product_id')],
			},
			delete: {
				path: '/:product_id',
				method: 'delete',
				handlers: [validateParamsWhenId('product_id')],
			},
			find: {
				path: '/:product_id',
				method: 'get',
				handlers: [validateParamsWhenId('product_id')],
			},
			summary: {
				path: '/:product_id/summary',
				method: 'get',
				handlers: [validateParamsWhenId('product_id')],
			},
		},
	};

	return config;
};

import { ReviewStatusEnum } from '@/features/review/review.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { reviewController } = await import(
		'@/features/review/review.controller'
	);

	const config: FeatureRoutesModule<typeof reviewController> = {
		basePath: '/reviews',
		controller: reviewController,
		routes: {
			read: {
				path: '/:id',
				method: 'get',
				handlers: [validateParamsWhenId('id')],
			},
			// No `create`: a review is written by the buyer it belongs to, never filed on
			// their behalf - `user_id` is the author and there is nobody else to attribute
			// one to.
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
			statusUpdate: {
				path: '/:id/status/:status',
				method: 'patch',
				handlers: [
					validateParamsWhenId('id'),
					validateParamsWhenEnum({
						status: Object.values(ReviewStatusEnum),
					}),
				],
			},
		},
	};

	return config;
};

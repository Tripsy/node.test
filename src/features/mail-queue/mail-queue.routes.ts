import { mailQueueController } from '@/features/mail-queue/mail-queue.controller';
import { validateParamsWhenId } from '@/lib/middleware/validate-params.middleware';
import type { RoutesConfigType } from '@/lib/types/routing.type';

export default {
	basePath: '/mail-queue',
	documentation: 'mail-queue',
	controller: mailQueueController,
	routesConfig: {
		read: {
			path: '/:id',
			method: 'get',
			action: 'read',
			handlers: [validateParamsWhenId('id')],
		},
		delete: {
			path: '',
			method: 'delete',
			action: 'delete',
		},
		find: {
			path: '',
			method: 'get',
			action: 'find',
		},
	} as RoutesConfigType<typeof mailQueueController>,
};

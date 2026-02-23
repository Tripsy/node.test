import type UserPermissionEntity from '@/features/user-permission/user-permission.entity';
import {
	UserPermissionOrderByEnum,
	type UserPermissionValidator,
} from '@/features/user-permission/user-permission.validator';
import { createPastDate } from '@/helpers';
import { createValidatorPayloads } from '@/helpers/mock.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getUserPermissionEntityMock(): UserPermissionEntity {
	return {
		id: 1,
		user_id: 1,
		permission_id: 1,
		created_at: createPastDate(86400),
		deleted_at: null,
	};
}

export const userPermissionInputPayloads = createValidatorPayloads<
	UserPermissionValidator,
	'create' | 'find'
>({
	create: {
		permission_ids: [1, 2],
	},
	find: {
		page: 1,
		limit: 10,
		order_by: UserPermissionOrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			entity: 'user',
			operation: 'create',
			is_deleted: false,
		},
	},
});

export const userPermissionOutputPayloads = createValidatorPayloads<
	UserPermissionValidator,
	'create'
>({
	create: {
		permission_ids: [1, 2],
	},
});

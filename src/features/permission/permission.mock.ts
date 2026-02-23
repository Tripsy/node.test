import type PermissionEntity from '@/features/permission/permission.entity';
import {
	PermissionOrderByEnum,
	type PermissionValidator,
} from '@/features/permission/permission.validator';
import { createValidatorPayloads } from '@/helpers/mock.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getPermissionEntityMock(): PermissionEntity {
	return {
		id: 1,
		entity: 'user',
		operation: 'create',
		deleted_at: null,
	};
}

export const permissionInputPayloads = createValidatorPayloads<
	PermissionValidator,
	'manage' | 'find'
>({
	manage: {
		entity: 'user',
		operation: 'create',
	},
	find: {
		page: 1,
		limit: 10,
		order_by: PermissionOrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'user',
			is_deleted: false,
		},
	},
});

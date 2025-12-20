import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	makeFindValidator,
	validateBoolean,
	validateStringMin,
} from '@/lib/helpers';

export function UserPermissionCreateValidator() {
	return z.object({
		permission_ids: z.array(z.number(), {
			message: lang('shared.error.invalid_ids', {
				name: 'ids',
			}),
		}),
	});
}

enum UserPermissionOrderByEnum {
	ID = 'id',
	PERMISSION_ID = 'permission_id',
	ENTITY = 'permission.entity',
	OPERATION = 'permission.operation',
}

export function UserPermissionFindValidator() {
	return makeFindValidator({
		orderByEnum: UserPermissionOrderByEnum,
		defaultOrderBy: UserPermissionOrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: cfg('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
			user_id: z.coerce
				.number({ message: lang('shared.error.invalid_number') })
				.optional(),
			entity: validateStringMin(
				lang('shared.error.invalid_string'),
				cfg('filter.termMinLength') as number,
				lang('shared.error.string_min', {
					min: cfg('filter.termMinLength') as string,
				}),
			).optional(),
			operation: validateStringMin(
				lang('shared.error.invalid_string'),
				cfg('filter.termMinLength') as number,
				lang('shared.error.string_min', {
					min: cfg('filter.termMinLength') as string,
				}),
			).optional(),
			is_deleted: validateBoolean().default(false),
		},
	});
}

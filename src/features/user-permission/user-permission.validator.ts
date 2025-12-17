import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	makeFindValidator,
	validateBoolean,
	validateStringMin,
} from '@/helpers';

export function UserPermissionCreateValidator() {
	return z.object({
		permission_ids: z.array(z.number(), {
			message: lang('permission.validation.permission_ids_invalid'),
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

		filterShape: {
			user_id: z.coerce
				.number({ message: lang('error.invalid_number') })
				.optional(),
			entity: validateStringMin(
				lang('error.invalid_string'),
				cfg('filter.termMinLength') as number,
				lang('error.string_min', {
					min: cfg('filter.termMinLength') as string,
				}),
			).optional(),
			operation: validateStringMin(
				lang('error.invalid_string'),
				cfg('filter.termMinLength') as number,
				lang('error.string_min', {
					min: cfg('filter.termMinLength') as string,
				}),
			).optional(),
			is_deleted: validateBoolean().default(false),
		},
	});
}

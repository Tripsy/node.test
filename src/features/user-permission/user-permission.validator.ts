import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { booleanFromString, makeJsonFilterSchema } from '@/helpers';

export const UserPermissionCreateValidator = z.object({
	permission_ids: z.array(z.number(), {
		message: lang('permission.validation.permission_ids_invalid'),
	}),
});

enum UserPermissionOrderByEnum {
	ID = 'id',
	PERMISSION_ID = 'permission_id',
	ENTITY = 'permission.entity',
	OPERATION = 'permission.operation',
}

export const UserPermissionFindValidator = z.object({
	order_by: z
		.nativeEnum(UserPermissionOrderByEnum)
		.optional()
		.default(UserPermissionOrderByEnum.ID),
	direction: z
		.nativeEnum(OrderDirectionEnum)
		.optional()
		.default(OrderDirectionEnum.ASC),
	limit: z.coerce
		.number({ message: lang('error.invalid_number') })
		.min(1)
		.optional()
		.default(cfg('filter.limit') as number),
	page: z.coerce
		.number({ message: lang('error.invalid_number') })
		.min(1)
		.optional()
		.default(1),
	filter: makeJsonFilterSchema({
		user_id: z.coerce
			.number({ message: lang('error.invalid_number') })
			.optional(),
		entity: z
			.string({ message: lang('error.invalid_string') })
			.min(cfg('filter.termMinLength') as number, {
				message: lang('error.string_min', {
					min: cfg('filter.termMinLength') as string,
					field: 'entity',
				}),
			})
			.optional(),
		operation: z
			.string({ message: lang('error.invalid_string') })
			.min(cfg('filter.termMinLength') as number, {
				message: lang('error.string_min', {
					min: cfg('filter.termMinLength') as string,
					field: 'operation',
				}),
			})
			.optional(),
		is_deleted: booleanFromString().default(false),
	})
		.optional()
		.default({
			user_id: undefined,
			entity: undefined,
			operation: undefined,
			is_deleted: false,
		}),
});

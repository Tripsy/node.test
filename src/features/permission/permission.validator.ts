import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { booleanFromString, makeJsonFilterSchema } from '@/helpers';

export const PermissionCreateValidator = z.object({
	entity: z.string({ message: lang('permission.validation.entity_invalid') }),
	operation: z.string({ message: lang('user.validation.operation_invalid') }),
});

export const PermissionUpdateValidator = z.object({
	entity: z.string({ message: lang('permission.validation.entity_invalid') }),
	operation: z.string({ message: lang('user.validation.operation_invalid') }),
});

enum PermissionOrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	OPERATION = 'operation',
}

export const PermissionFindValidator = z.object({
	order_by: z
		.nativeEnum(PermissionOrderByEnum)
		.optional()
		.default(PermissionOrderByEnum.ID),
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
		id: z.coerce
			.number({ message: lang('error.invalid_number') })
			.optional(),
		term: z.string({ message: lang('error.invalid_string') }).optional(),
		is_deleted: booleanFromString().default(false),
	})
		.optional()
		.default({
			id: undefined,
			term: undefined,
			is_deleted: false,
		}),
});

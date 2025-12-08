import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { makeFindValidator, validateBoolean, validateString } from '@/helpers';

export const PermissionCreateValidator = z.object({
	entity: validateString(lang('permission.validation.entity_invalid')),
	operation: validateString(lang('permission.validation.operation_invalid')),
});

export const PermissionUpdateValidator = z.object({
	entity: validateString(lang('permission.validation.entity_invalid')),
	operation: validateString(lang('permission.validation.operation_invalid')),
});

enum PermissionOrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	OPERATION = 'operation',
}

export const PermissionFindValidator = makeFindValidator({
	orderByEnum: PermissionOrderByEnum,
	defaultOrderBy: PermissionOrderByEnum.ID,

	directionEnum: OrderDirectionEnum,
	defaultDirection: OrderDirectionEnum.ASC,

	filterShape: {
		id: z.coerce
			.number({ message: lang('error.invalid_number') })
			.optional(),
		term: z.string({ message: lang('error.invalid_string') }).optional(),
		is_deleted: validateBoolean().default(false),
	},
});

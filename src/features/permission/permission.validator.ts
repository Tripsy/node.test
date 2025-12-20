import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	makeFindValidator,
	validateBoolean,
	validateString,
} from '@/lib/helpers';

export function PermissionManageValidator() {
	return z.object({
		entity: validateString(lang('permission.validation.entity_invalid')),
		operation: validateString(
			lang('permission.validation.operation_invalid'),
		),
	});
}

enum PermissionOrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	OPERATION = 'operation',
}

export function PermissionFindValidator() {
	return makeFindValidator({
		orderByEnum: PermissionOrderByEnum,
		defaultOrderBy: PermissionOrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: cfg('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
			id: z.coerce
				.number({ message: lang('shared.error.invalid_number') })
				.optional(),
			term: z
				.string({ message: lang('shared.error.invalid_string') })
				.optional(),
			is_deleted: validateBoolean().default(false),
		},
	});
}

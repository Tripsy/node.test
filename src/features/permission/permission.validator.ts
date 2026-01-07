import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	makeFindValidator,
	validateBoolean,
	validateString,
} from '@/lib/helpers';

enum PermissionOrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	OPERATION = 'operation',
}

export class PermissionValidator {
	private readonly defaultFilterLimit = cfg('filter.limit') as number;

	manage() {
		return z.object({
			entity: validateString(
				lang('permission.validation.entity_invalid'),
			),
			operation: validateString(
				lang('permission.validation.operation_invalid'),
			),
		});
	}

	find() {
		return makeFindValidator({
			orderByEnum: PermissionOrderByEnum,
			defaultOrderBy: PermissionOrderByEnum.ID,

			directionEnum: OrderDirectionEnum,
			defaultDirection: OrderDirectionEnum.ASC,

			defaultLimit: this.defaultFilterLimit,
			defaultPage: 1,

			filterShape: {
				id: z.coerce
					.number({
						message: lang('shared.validation.invalid_number'),
					})
					.optional(),
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.optional(),
				is_deleted: validateBoolean().default(false),
			},
		});
	}
}

export const permissionValidator = new PermissionValidator();

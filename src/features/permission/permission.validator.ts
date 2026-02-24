import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export enum PermissionOrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	OPERATION = 'operation',
}

export class PermissionValidator extends BaseValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	manage() {
		return z.object({
			entity: this.validateString(
				lang('permission.validation.entity_invalid'),
			),
			operation: this.validateString(
				lang('permission.validation.operation_invalid'),
			),
		});
	}

	find() {
		return this.makeFindValidator({
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
				is_deleted: this.validateBoolean().default(false),
			},
		});
	}
}

export const permissionValidator = new PermissionValidator();

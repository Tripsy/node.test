import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export enum UserPermissionOrderByEnum {
	ID = 'id',
	PERMISSION_ID = 'permission_id',
	ENTITY = 'permission.entity',
	OPERATION = 'permission.operation',
}

export class UserPermissionValidator extends BaseValidator {
	private readonly termMinLength = Configuration.get(
		'filter.termMinLength',
	) as number;
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	public create() {
		return z.object({
			permission_ids: z.array(
				z
					.number({
						message: lang('shared.validation.invalid_ids', {
							name: 'ids',
						}),
					})
					.positive(),
				{
					message: lang('shared.validation.invalid_ids', {
						name: 'ids',
					}),
				},
			),
		});
	}

	find() {
		return this.makeFindValidator({
			orderByEnum: UserPermissionOrderByEnum,
			defaultOrderBy: UserPermissionOrderByEnum.ID,

			directionEnum: OrderDirectionEnum,
			defaultDirection: OrderDirectionEnum.ASC,

			defaultLimit: this.defaultFilterLimit,
			defaultPage: 1,

			filterShape: {
				user_id: z.coerce
					.number({
						message: lang('shared.validation.invalid_number'),
					})
					.optional(),
				entity: this.validateStringMin(
					lang('shared.validation.invalid_string'),
					this.termMinLength,
					lang('shared.validation.string_min', {
						min: this.termMinLength.toString(),
					}),
				).optional(),
				operation: this.validateStringMin(
					lang('shared.validation.invalid_string'),
					this.termMinLength,
					lang('shared.validation.string_min', {
						min: this.termMinLength.toString(),
					}),
				).optional(),
				is_deleted: this.validateBoolean().default(false),
			},
		});
	}
}

export const userPermissionValidator = new UserPermissionValidator();

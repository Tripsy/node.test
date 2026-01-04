import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	makeFindValidator,
	validateBoolean,
	validateStringMin,
} from '@/lib/helpers';

enum UserPermissionOrderByEnum {
	ID = 'id',
	PERMISSION_ID = 'permission_id',
	ENTITY = 'permission.entity',
	OPERATION = 'permission.operation',
}

class UserPermissionValidator {
	private readonly termMinLength = cfg('user.termMinLength') as number;
	private readonly defaultFilterLimit = cfg('filter.limit') as number;

	public create() {
		return z.object({
			permission_ids: z.array(
				z.coerce
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
		return makeFindValidator({
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
				entity: validateStringMin(
					lang('shared.validation.invalid_string'),
					this.termMinLength,
					lang('shared.validation.string_min', {
						min: this.termMinLength.toString(),
					}),
				).optional(),
				operation: validateStringMin(
					lang('shared.validation.invalid_string'),
					this.termMinLength,
					lang('shared.validation.string_min', {
						min: this.termMinLength.toString(),
					}),
				).optional(),
				is_deleted: validateBoolean().default(false),
			},
		});
	}
}

export const userPermissionValidator = new UserPermissionValidator();

export type UserPermissionValidatorCreateDto = z.infer<
	ReturnType<UserPermissionValidator['create']>
>;
export type UserPermissionValidatorFindDto = z.infer<
	ReturnType<UserPermissionValidator['find']>
>;

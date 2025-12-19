import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	UserOperatorTypeEnum,
	UserRoleEnum,
	UserStatusEnum,
} from '@/features/user/user.entity';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	nullableString,
	validateBoolean,
	validateDate,
	validateStringMin,
} from '@/helpers';

export const paramsUpdateList: string[] = [
	'name',
	'email',
	'password',
	'language',
	'role',
	'operator_type',
];

export function UserCreateValidator() {
	return z
		.object({
			name: validateStringMin(
				lang('user.validation.name_invalid'),
				cfg('user.nameMinLength') as number,
				lang('user.validation.name_min', {
					min: cfg('user.nameMinLength') as string,
				}),
			),
			email: z.email({ message: lang('user.validation.email_invalid') }),
			password: z
				.string({ message: lang('user.validation.password_invalid') })
				.min(cfg('user.passwordMinLength') as number, {
					message: lang('user.validation.password_min', {
						min: cfg('user.passwordMinLength') as string,
					}),
				})
				.refine((value) => /[A-Z]/.test(value), {
					message: lang(
						'user.validation.password_condition_capital_letter',
					),
				})
				.refine((value) => /[0-9]/.test(value), {
					message: lang('user.validation.password_condition_number'),
				})
				.refine(
					(value) => /[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value),
					{
						message: lang(
							'user.validation.password_condition_special_character',
						),
					},
				),
			password_confirm: z.string({
				message: lang('user.validation.password_confirm_required'),
			}),
			language: z
				.string()
				.length(2, {
					message: lang('user.validation.language_invalid'),
				})
				.optional(),
			status: z
				.enum(UserStatusEnum)
				.optional()
				.default(UserStatusEnum.PENDING),
			role: z.enum(UserRoleEnum).optional().default(UserRoleEnum.MEMBER),
			operator_type: z.enum(UserOperatorTypeEnum).nullable().optional(),
		})
		.superRefine(({ password, password_confirm }, ctx) => {
			if (password !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: lang('user.validation.password_confirm_mismatch'),
					code: 'custom',
				});
			}
		})
		.superRefine(({ role, operator_type }, ctx) => {
			if (role === UserRoleEnum.OPERATOR && !operator_type) {
				ctx.addIssue({
					path: ['operator_type'],
					message: lang('user.validation.operator_type_required'),
					code: 'custom',
				});
			}

			if (role !== UserRoleEnum.OPERATOR && operator_type) {
				ctx.addIssue({
					path: ['operator_type'],
					message: lang(
						'user.validation.operator_type_only_for_operator',
					),
					code: 'custom',
				});
			}
		});
}

export function UserUpdateValidator() {
	return z
		.object({
			name: validateStringMin(
				lang('user.validation.name_invalid'),
				cfg('user.nameMinLength') as number,
				lang('user.validation.name_min', {
					min: cfg('user.nameMinLength') as string,
				}),
			).optional(),
			email: z
				.email({ message: lang('user.validation.email_invalid') })
				.optional(),
			password: z.preprocess(
				(val) => (val === '' ? undefined : val),
				z
					.string({
						message: lang('user.validation.password_invalid'),
					})
					.min(cfg('user.passwordMinLength') as number, {
						message: lang('user.validation.password_min', {
							min: cfg('user.passwordMinLength') as string,
						}),
					})
					.refine((value) => /[A-Z]/.test(value), {
						message: lang(
							'user.validation.password_condition_capital_letter',
						),
					})
					.refine((value) => /[0-9]/.test(value), {
						message: lang(
							'user.validation.password_condition_number',
						),
					})
					.refine(
						(value) =>
							/[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value),
						{
							message: lang(
								'user.validation.password_condition_special_character',
							),
						},
					)
					.optional(),
			),
			password_confirm: nullableString(
				lang('user.validation.password_confirm_required'),
			),
			language: z
				.string()
				.length(2, {
					message: lang('user.validation.language_invalid'),
				})
				.optional(),
			role: z.enum(UserRoleEnum).optional(),
			operator_type: z.enum(UserOperatorTypeEnum).nullable().optional(),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: lang('shared.error.params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		})
		.superRefine(({ password, password_confirm }, ctx) => {
			if (password !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: lang('user.validation.password_confirm_mismatch'),
					code: 'custom',
				});
			}
		})
		.superRefine(({ role, operator_type }, ctx) => {
			// If the role is being set to OPERATOR, operator_type must be provided
			if (
				role === UserRoleEnum.OPERATOR &&
				(operator_type === null || operator_type === undefined)
			) {
				ctx.addIssue({
					path: ['operator_type'],
					message: lang('user.validation.operator_type_required'),
					code: 'custom',
				});
			}

			// If the role is being set to something other than OPERATOR, operator_type must be null
			if (
				role &&
				role !== UserRoleEnum.OPERATOR &&
				operator_type !== null &&
				operator_type !== undefined
			) {
				ctx.addIssue({
					path: ['operator_type'],
					message: lang(
						'user.validation.operator_type_only_for_operator',
					),
					code: 'custom',
				});
			}
		});
}

enum OrderByEnum {
	ID = 'id',
	NAME = 'name',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export function UserFindValidator() {
	return makeFindValidator({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		filterShape: {
			id: z.coerce
				.number({ message: lang('shared.error.invalid_number') })
				.optional(),
			term: z
				.string({ message: lang('shared.error.invalid_string') })
				.optional(),
			status: z.enum(UserStatusEnum).optional(),
			role: z.enum(UserRoleEnum).optional(),
			create_date_start: validateDate(),
			create_date_end: validateDate(),
			is_deleted: validateBoolean().default(false),
		},
	}).superRefine((data, ctx) => {
		if (
			data.filter.create_date_start &&
			data.filter.create_date_end &&
			data.filter.create_date_start > data.filter.create_date_end
		) {
			ctx.addIssue({
				path: ['filter', 'create_date_start'],
				message: lang('shared.error.invalid_date_range'),
				code: 'custom',
			});
		}
	});
}

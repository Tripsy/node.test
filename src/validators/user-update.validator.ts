import { z } from 'zod';
import { lang } from '../config/i18n-setup.config';
import { cfg } from '../config/settings.config';
import { UserRoleEnum } from '../enums/user-role.enum';
import { hasAtLeastOneValue } from '../helpers/utils.helper';

export const paramsUpdateList: string[] = [
	'name',
	'email',
	'password',
	'language',
	'role',
];

const UserUpdateValidator = z
	.object({
		name: z
			.string({ message: lang('user.validation.name_invalid') })
			.min(cfg('user.nameMinLength') as number, {
				message: lang('user.validation.name_min', {
					min: cfg('user.nameMinLength') as string,
				}),
			}),
		email: z
			.string({ message: lang('user.validation.email_invalid') })
			.email({ message: lang('user.validation.email_invalid') }),
		password: z.preprocess(
			(val) => (val === '' ? undefined : val),
			z
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
				)
				.optional(),
		),
		password_confirm: z.preprocess(
			(val) => (val === '' ? undefined : val),
			z
				.string({
					message: lang('user.validation.password_confirm_required'),
				})
				.optional(),
		),
		language: z
			.string({ message: lang('user.validation.language_invalid') })
			.length(2, { message: lang('user.validation.language_invalid') }),
		role: z.nativeEnum(UserRoleEnum),
	})
	.refine((data) => hasAtLeastOneValue(data), {
		message: lang('error.params_at_least_one', {
			params: paramsUpdateList.join(', '),
		}),
		path: ['_global'],
	})
	.superRefine(({ password, password_confirm }, ctx) => {
		if (password !== password_confirm) {
			ctx.addIssue({
				path: ['password_confirm'],
				message: lang('user.validation.password_confirm_mismatch'),
				code: z.ZodIssueCode.custom,
			});
		}
	});

export default UserUpdateValidator;

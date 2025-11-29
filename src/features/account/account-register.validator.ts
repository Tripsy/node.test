import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';

const AccountRegisterValidator = z
	.object({
		name: z
			.string({ message: lang('account.validation.name_invalid') })
			.min(cfg('user.nameMinLength') as number, {
				message: lang('account.validation.name_min', {
					min: cfg('user.nameMinLength') as string,
				}),
			}),
		email: z
			.string({ message: lang('account.validation.email_invalid') })
			.email({ message: lang('account.validation.email_invalid') }),
		password: z
			.string({ message: lang('account.validation.password_invalid') })
			.min(cfg('user.passwordMinLength') as number, {
				message: lang('account.validation.password_min', {
					min: cfg('user.passwordMinLength') as string,
				}),
			})
			.refine((value) => /[A-Z]/.test(value), {
				message: lang(
					'account.validation.password_condition_capital_letter',
				),
			})
			.refine((value) => /[0-9]/.test(value), {
				message: lang('account.validation.password_condition_number'),
			})
			.refine((value) => /[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value), {
				message: lang(
					'account.validation.password_condition_special_character',
				),
			}),
		password_confirm: z.string({
			message: lang('account.validation.password_confirm_required'),
		}),
		language: z
			.string({ message: lang('account.validation.language_invalid') })
			.length(2, { message: lang('account.validation.language_invalid') })
			.optional(),
	})
	.superRefine(({ password, password_confirm }, ctx) => {
		if (password !== password_confirm) {
			ctx.addIssue({
				path: ['password_confirm'],
				message: lang('account.validation.password_confirm_mismatch'),
				code: z.ZodIssueCode.custom,
			});
		}
	});

export default AccountRegisterValidator;

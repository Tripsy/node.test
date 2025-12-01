import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';

const AccountPasswordUpdateValidator = z
	.object({
		password_current: z
			.string({
				message: lang('account.validation.password_invalid'),
			})
			.trim()
			.nonempty({
				message: lang('account.validation.password_invalid'),
			}),
		password_new: z
			.string({ message: lang('account.validation.password_invalid') })
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
			.refine((value) => /[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value), {
				message: lang(
					'user.validation.password_condition_special_character',
				),
			}),
		password_confirm: z.string({
			message: lang('user.validation.password_confirm_required'),
		}),
	})
	.superRefine(({ password_new, password_confirm }, ctx) => {
		if (password_new !== password_confirm) {
			ctx.addIssue({
				path: ['password_confirm'],
				message: lang('user.validation.password_confirm_mismatch'),
				code: z.ZodIssueCode.custom,
			});
		}
	});

export default AccountPasswordUpdateValidator;

import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { validateStringMin } from '@/lib/helpers';

export function AccountRegisterValidator() {
	return z
		.object({
			name: validateStringMin(
				lang('account.validation.name_invalid'),
				cfg('user.nameMinLength') as number,
				lang('account.validation.name_min', {
					min: cfg('user.nameMinLength') as string,
				}),
			),
			email: z.email({
				message: lang('account.validation.email_invalid'),
			}),
			password: z
				.string({
					message: lang('account.validation.password_invalid'),
				})
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
					message: lang(
						'account.validation.password_condition_number',
					),
				})
				.refine(
					(value) => /[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value),
					{
						message: lang(
							'account.validation.password_condition_special_character',
						),
					},
				),
			password_confirm: z.string({
				message: lang('account.validation.password_confirm_required'),
			}),
			language: z
				.string()
				.length(2, {
					message: lang('account.validation.language_invalid'),
				})
				.optional(),
		})
		.superRefine(({ password, password_confirm }, ctx) => {
			if (password !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: lang(
						'account.validation.password_confirm_mismatch',
					),
					code: 'custom',
				});
			}
		});
}

export function AccountLoginValidator() {
	return z.object({
		email: z.email({ message: lang('account.validation.email_invalid') }),
		password: z.string({
			message: lang('account.validation.password_invalid'),
		}),
	});
}

export function AccountPasswordRecoverValidator() {
	return z.object({
		email: z.email({ message: lang('account.validation.email_invalid') }),
	});
}

export function AccountPasswordRecoverChangeValidator() {
	return z
		.object({
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
		})
		.superRefine(({ password, password_confirm }, ctx) => {
			if (password !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: lang('user.validation.password_confirm_mismatch'),
					code: 'custom',
				});
			}
		});
}

export function AccountPasswordUpdateValidator() {
	return z
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
				.string({
					message: lang('account.validation.password_invalid'),
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
		})
		.superRefine(({ password_new, password_confirm }, ctx) => {
			if (password_new !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: lang('user.validation.password_confirm_mismatch'),
					code: 'custom',
				});
			}
		});
}

export function AccountEmailConfirmSendValidator() {
	return z.object({
		email: z.email({ message: lang('account.validation.email_invalid') }),
	});
}

export function AccountEmailUpdateValidator() {
	return z.object({
		email_new: z.email({
			message: lang('account.validation.email_invalid'),
		}),
	});
}

export function AccountEditValidator() {
	return z.object({
		name: validateStringMin(
			lang('account.validation.name_invalid'),
			cfg('user.nameMinLength') as number,
			lang('account.validation.name_min', {
				min: cfg('user.nameMinLength') as string,
			}),
		),
		language: z.string().length(2, {
			message: lang('account.validation.language_invalid'),
		}),
	});
}

export function AccountDeleteValidator() {
	return z.object({
		password_current: z
			.string({
				message: lang('account.validation.password_invalid'),
			})
			.trim()
			.nonempty({
				message: lang('account.validation.password_invalid'),
			}),
	});
}

export function AccountRemoveTokenValidator() {
	return z.object({
		ident: z.uuid({ message: lang('account.validation.ident_invalid') }),
	});
}

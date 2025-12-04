import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';

export const AccountRegisterValidator = z
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

export const AccountLoginValidator = z.object({
	email: z
		.string({ message: lang('account.validation.email_invalid') })
		.email({ message: lang('account.validation.email_invalid') }),
	password: z.string({
		message: lang('account.validation.password_invalid'),
	}),
});

export const AccountPasswordRecoverValidator = z.object({
	email: z
		.string({ message: lang('account.validation.email_invalid') })
		.email({ message: lang('account.validation.email_invalid') }),
});

export const AccountPasswordRecoverChangeValidator = z
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
			.refine((value) => /[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value), {
				message: lang(
					'user.validation.password_condition_special_character',
				),
			}),
		password_confirm: z.string({
			message: lang('user.validation.password_confirm_required'),
		}),
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

export const AccountPasswordUpdateValidator = z
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

export const AccountEmailConfirmSendValidator = z.object({
	email: z
		.string({ message: lang('account.validation.email_invalid') })
		.email({ message: lang('account.validation.email_invalid') }),
});

export const AccountEmailUpdateValidator = z.object({
	email_new: z
		.string({ message: lang('account.validation.email_invalid') })
		.email({ message: lang('account.validation.email_invalid') }),
});

export const paramsUpdateList: string[] = ['name', 'language'];

export const AccountEditValidator = z.object({
	name: z
		.string({ message: lang('account.validation.name_invalid') })
		.min(cfg('user.nameMinLength') as number, {
			message: lang('account.validation.name_min', {
				min: cfg('user.nameMinLength') as string,
			}),
		}),
	language: z
		.string({ message: lang('account.validation.language_invalid') })
		.length(2, { message: lang('account.validation.language_invalid') }),
});

export const AccountDeleteValidator = z.object({
	password_current: z
		.string({
			message: lang('account.validation.password_invalid'),
		})
		.trim()
		.nonempty({
			message: lang('account.validation.password_invalid'),
		}),
});

export const AccountRemoveTokenValidator = z.object({
	ident: z
		.string({ message: lang('account.validation.ident_required') })
		.uuid({ message: lang('account.validation.ident_invalid') }),
});

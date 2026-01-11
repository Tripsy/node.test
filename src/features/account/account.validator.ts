import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export class AccountValidator extends BaseValidator {
	private readonly nameMinLength = Configuration.get(
		'user.nameMinLength',
	) as number;
	private readonly passwordMinLength = Configuration.get(
		'user.passwordMinLength',
	) as number;

	public register() {
		return z
			.object({
				name: this.validateStringMin(
					lang('account.validation.name_invalid'),
					this.nameMinLength,
					lang('account.validation.name_min', {
						min: this.nameMinLength.toString(),
					}),
				),
				email: z.email({
					message: lang('account.validation.email_invalid'),
				}),
				password: z
					.string({
						message: lang('account.validation.password_invalid'),
					})
					.min(this.passwordMinLength, {
						message: lang('account.validation.password_min', {
							min: this.passwordMinLength.toString(),
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
						(value) =>
							/[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value),
						{
							message: lang(
								'account.validation.password_condition_special_character',
							),
						},
					),
				password_confirm: z.string({
					message: lang(
						'account.validation.password_confirm_required',
					),
				}),
				language: this.validateLanguage().optional(),
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

	public login() {
		return z.object({
			email: z.email({
				message: lang('account.validation.email_invalid'),
			}),
			password: z.string({
				message: lang('account.validation.password_invalid'),
			}),
		});
	}

	public passwordRecover() {
		return z.object({
			email: z.email({
				message: lang('account.validation.email_invalid'),
			}),
		});
	}

	public passwordRecoverChange() {
		return z
			.object({
				password: z
					.string({
						message: lang('account.validation.password_invalid'),
					})
					.min(this.passwordMinLength, {
						message: lang('account.validation.password_min', {
							min: this.passwordMinLength.toString(),
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
						(value) =>
							/[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value),
						{
							message: lang(
								'account.validation.password_condition_special_character',
							),
						},
					),
				password_confirm: z.string({
					message: lang(
						'account.validation.password_confirm_required',
					),
				}),
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

	public passwordUpdate() {
		return z
			.object({
				password_current: this.validateString(
					lang('account.validation.password_invalid'),
				),
				password_new: z
					.string({
						message: lang('account.validation.password_invalid'),
					})
					.min(this.passwordMinLength, {
						message: lang('account.validation.password_min', {
							min: this.passwordMinLength.toString(),
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
						(value) =>
							/[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value),
						{
							message: lang(
								'account.validation.password_condition_special_character',
							),
						},
					),
				password_confirm: z.string({
					message: lang(
						'account.validation.password_confirm_required',
					),
				}),
			})
			.superRefine(({ password_new, password_confirm }, ctx) => {
				if (password_new !== password_confirm) {
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

	public emailConfirmSend() {
		return z.object({
			email: z.email({
				message: lang('account.validation.email_invalid'),
			}),
		});
	}

	public emailUpdate() {
		return z.object({
			email_new: z.email({
				message: lang('account.validation.email_invalid'),
			}),
		});
	}

	public removeToken() {
		return z.object({
			ident: z.uuid({
				message: lang('account.validation.ident_invalid'),
			}),
		});
	}

	public meEdit() {
		return z.object({
			name: this.validateStringMin(
				lang('account.validation.name_invalid'),
				this.nameMinLength,
				lang('account.validation.name_min', {
					min: this.nameMinLength.toString(),
				}),
			),
			language: this.validateLanguage(),
		});
	}

	public meDelete() {
		return z.object({
			password_current: this.validateString(
				lang('account.validation.password_invalid'),
			),
		});
	}
}

export const accountValidator = new AccountValidator();

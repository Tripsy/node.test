import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	validateLanguage,
	validateString,
	validateStringMin,
} from '@/lib/helpers';

export class AccountValidator {
	private readonly nameMinLength = cfg('user.nameMinLength') as number;
	private readonly passwordMinLength = cfg(
		'user.passwordMinLength',
	) as number;

	public register() {
		return z
			.object({
				name: validateStringMin(
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
				language: validateLanguage().optional(),
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
						message: lang('user.validation.password_invalid'),
					})
					.min(this.passwordMinLength, {
						message: lang('user.validation.password_min', {
							min: this.passwordMinLength.toString(),
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
					),
				password_confirm: z.string({
					message: lang('user.validation.password_confirm_required'),
				}),
			})
			.superRefine(({ password, password_confirm }, ctx) => {
				if (password !== password_confirm) {
					ctx.addIssue({
						path: ['password_confirm'],
						message: lang(
							'user.validation.password_confirm_mismatch',
						),
						code: 'custom',
					});
				}
			});
	}

	public passwordUpdate() {
		return z
			.object({
				password_current: validateString(
					lang('account.validation.password_invalid'),
				),
				password_new: z
					.string({
						message: lang('account.validation.password_invalid'),
					})
					.min(this.passwordMinLength, {
						message: lang('user.validation.password_min', {
							min: this.passwordMinLength.toString(),
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
					),
				password_confirm: z.string({
					message: lang('user.validation.password_confirm_required'),
				}),
			})
			.superRefine(({ password_new, password_confirm }, ctx) => {
				if (password_new !== password_confirm) {
					ctx.addIssue({
						path: ['password_confirm'],
						message: lang(
							'user.validation.password_confirm_mismatch',
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

	public edit() {
		return z.object({
			name: validateStringMin(
				lang('account.validation.name_invalid'),
				this.nameMinLength,
				lang('account.validation.name_min', {
					min: this.nameMinLength.toString(),
				}),
			),
			language: validateLanguage(),
		});
	}

	public delete() {
		return z.object({
			password_current: validateString(
				lang('account.validation.password_invalid'),
			),
		});
	}

	public removeToken() {
		return z.object({
			ident: z.uuid({
				message: lang('account.validation.ident_invalid'),
			}),
		});
	}
}

export const accountValidator = new AccountValidator();

export type AccountValidatorRegisterDto = z.infer<
	ReturnType<AccountValidator['register']>
>;
export type AccountValidatorLoginDto = z.infer<
	ReturnType<AccountValidator['login']>
>;
export type AccountValidatorPasswordRecoverDto = z.infer<
	ReturnType<AccountValidator['passwordRecover']>
>;
export type AccountValidatorPasswordRecoverChangeDto = z.infer<
	ReturnType<AccountValidator['passwordRecoverChange']>
>;
export type AccountValidatorPasswordUpdateDto = z.infer<
	ReturnType<AccountValidator['passwordUpdate']>
>;
export type AccountValidatorEmailConfirmSendDto = z.infer<
	ReturnType<AccountValidator['emailConfirmSend']>
>;
export type AccountValidatorEmailUpdateDto = z.infer<
	ReturnType<AccountValidator['emailUpdate']>
>;
export type AccountValidatorEditDto = z.infer<
	ReturnType<AccountValidator['edit']>
>;
export type AccountValidatorDeleteDto = z.infer<
	ReturnType<AccountValidator['delete']>
>;
export type AccountValidatorRemoveTokenDto = z.infer<
	ReturnType<AccountValidator['removeToken']>
>;

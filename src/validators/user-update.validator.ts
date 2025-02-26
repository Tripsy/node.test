import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {settings} from '../config/settings.config';

export const paramsUpdateList: string[] = ['name', 'email', 'password', 'language'];

const UserUpdateValidator = z
    .object({
        name: z
            .string({message: lang('user.validation.name_invalid')})
            .min(settings.user.nameMinLength, {
                message: lang('user.validation.name_min', {min: settings.user.nameMinLength.toString()}),
            })
            .optional(),
        email: z
            .string({message: lang('user.validation.email_invalid')})
            .email({message: lang('user.validation.email_invalid')})
            .optional(),
        password: z
            .string({message: lang('user.validation.password_invalid')})
            .min(settings.user.passwordMinLength, {
                message: lang('user.validation.password_min', {min: settings.user.passwordMinLength.toString()}),
            })
            .refine((value) => /[A-Z]/.test(value), {
                message: lang('user.validation.password_condition_capital_letter'),
            })
            .refine((value) => /[0-9]/.test(value), {
                message: lang('user.validation.password_condition_number'),
            })
            .refine((value) => /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(value), {
                message: lang('user.validation.password_condition_special_character'),
            })
            .optional(),
        password_confirm: z
            .string({message: lang('user.validation.password_confirm_required')})
            .optional(),
        language: z
            .string({message: lang('user.validation.language_invalid')})
            .length(2, {message: lang('user.validation.language_invalid')})
            .optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: lang('error.params_at_least_one', {params: paramsUpdateList.join(', ')}),
        path: ['_global'], // Attach error at the root level
    })
    .superRefine(({password, password_confirm}, ctx) => {
        if (password && password !== password_confirm) {
            ctx.addIssue({
                path: ['password_confirm'],
                message: lang('user.validation.password_confirm_mismatch'),
                code: z.ZodIssueCode.custom,
            });
        }
    });

export default UserUpdateValidator;

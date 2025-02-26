import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {settings} from '../config/settings.config';

const AccountPasswordRecoverChangeValidator = z
    .object({
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
            }),
        password_confirm: z
            .string({message: lang('user.validation.password_confirm_required')}),
    })
    .superRefine(({password, password_confirm}, ctx) => {
        if (password !== password_confirm) {
            ctx.addIssue({
                path: ['password_confirm'],
                message: lang('user.validation.password_confirm_mismatch'),
                code: z.ZodIssueCode.custom,
            });
        }
    });

export default AccountPasswordRecoverChangeValidator;

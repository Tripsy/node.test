import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {UserStatusEnum} from '../enums/user-status.enum';
import {settings} from '../config/settings.config';

const UserCreateValidator = z
    .object({
        name: z
            .string({message: lang('user.validation.name_invalid')})
            .min(settings.user.nameMinLength, {
                message: lang('user.validation.name_min', {min: settings.user.nameMinLength.toString()}),
            }),
        email: z
            .string({message: lang('user.validation.email_invalid')})
            .email({message: lang('user.validation.email_invalid')}),
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
        password_confirmation: z
            .string({message: lang('user.validation.password_confirmation_required')}),
        language: z
            .string({message: lang('user.validation.language_invalid')})
            .length(2, {message: lang('user.validation.language_invalid')})
            .optional(),
        status: z
            .nativeEnum(UserStatusEnum)
            .optional()
            .default(UserStatusEnum.PENDING),
    })
    .superRefine(({password, password_confirmation}, ctx) => {
        if (password !== password_confirmation) {
            ctx.addIssue({
                path: ['password_confirmation'],
                message: lang('user.validation.password_confirmation_mismatch'),
                code: z.ZodIssueCode.custom,
            });
        }
    });

export default UserCreateValidator;

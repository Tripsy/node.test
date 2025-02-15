import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {settings} from '../config/settings.config';

export const paramsUpdateList: string[] = ['name', 'language'];

const UserUpdateValidator = z
    .object({
        name: z
            .string({message: lang('user.validation.name_invalid')})
            .min(settings.user.nameMinLength, {
                message: lang('user.validation.name_min', {min: settings.user.nameMinLength.toString()}),
            })
            .optional(),
        language: z
            .string({message: lang('user.validation.language_invalid')})
            .length(2, {message: lang('user.validation.language_invalid')})
            .optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: lang('error.params_at_least_one', {params: paramsUpdateList.join(', ')}),
        path: ['_global'], // Attach error at the root level
    });

export default UserUpdateValidator;

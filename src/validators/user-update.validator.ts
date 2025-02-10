import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {settings} from '../config/settings.config';

const paramsList = ['name'].join(', ');

const UserUpdateValidator = z
    .object({
        name: z
            .string({message: lang('user.validation.name_required')})
            .min(settings.user.passwordMinLength, {
                message: lang('user.validation.name_min', {min: settings.user.nameMinLength.toString()}),
            })
            .optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: lang('error.params_at_least_one', {params: paramsList}),
        path: ['_global'], // Attach error at the root level
    });

export default UserUpdateValidator;

import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';

const AccountLoginValidator = z
    .object({
        email: z
            .string({message: lang('account.validation.email_required')})
            .email({message: lang('account.validation.email_invalid')}),
        password: z
            .string({message: lang('account.validation.password_required')}),
    });

export default AccountLoginValidator;

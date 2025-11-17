import { z } from 'zod';
import { lang } from '../config/i18n-setup.config';

const AccountEmailUpdateValidator = z.object({
	email: z
		.string({ message: lang('user.validation.email_invalid') })
		.email({ message: lang('user.validation.email_invalid') }),
});

export default AccountEmailUpdateValidator;

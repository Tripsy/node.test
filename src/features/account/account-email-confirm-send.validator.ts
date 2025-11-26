import { z } from 'zod';
import { lang } from '@/config/i18n.setup';

const AccountEmailConfirmSendValidator = z.object({
	email: z
		.string({ message: lang('account.validation.email_invalid') })
		.email({ message: lang('account.validation.email_invalid') }),
});

export default AccountEmailConfirmSendValidator;

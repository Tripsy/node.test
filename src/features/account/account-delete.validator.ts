import { z } from 'zod';
import { lang } from '@/config/i18n.setup';

const AccountDeleteValidator = z.object({
	password_current: z
		.string({
			message: lang('account.validation.password_invalid'),
		})
		.trim()
		.nonempty({
			message: lang('account.validation.password_invalid'),
		}),
});

export default AccountDeleteValidator;

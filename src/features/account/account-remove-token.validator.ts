import { z } from 'zod';
import { lang } from '@/config/i18n-setup.config';

const AccountRemoveTokenValidator = z.object({
	ident: z
		.string({ message: lang('account.validation.ident_required') })
		.uuid({ message: lang('account.validation.ident_invalid') }),
});

export default AccountRemoveTokenValidator;

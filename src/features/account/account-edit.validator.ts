import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';

export const paramsUpdateList: string[] = ['name', 'language'];

const AccountEditValidator = z.object({
	name: z
		.string({ message: lang('account.validation.name_invalid') })
		.min(cfg('user.nameMinLength') as number, {
			message: lang('account.validation.name_min', {
				min: cfg('user.nameMinLength') as string,
			}),
		}),
	language: z
		.string({ message: lang('account.validation.language_invalid') })
		.length(2, { message: lang('account.validation.language_invalid') }),
});

export default AccountEditValidator;

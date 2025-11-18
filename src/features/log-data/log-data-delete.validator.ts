import { z } from 'zod';
import { lang } from '@/config/i18n-setup.config';

const LogDataDeleteValidator = z.object({
	ids: z.array(z.number(), {
		message: lang('log_data.validation.ids_invalid'),
	}),
});

export default LogDataDeleteValidator;

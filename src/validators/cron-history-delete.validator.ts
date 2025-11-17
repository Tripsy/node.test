import { z } from 'zod';
import { lang } from '../config/i18n-setup.config';

const CronHistoryDeleteValidator = z.object({
	ids: z.array(z.number(), {
		message: lang('cron_history.validation.ids_invalid'),
	}),
});

export default CronHistoryDeleteValidator;

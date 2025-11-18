import { z } from 'zod';
import { lang } from '@/config/i18n.setup';

const MailQueueDeleteValidator = z.object({
	ids: z.array(z.number(), {
		message: lang('mail_queue.validation.ids_invalid'),
	}),
});

export default MailQueueDeleteValidator;

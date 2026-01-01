import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';

class MailQueuePolicy extends PolicyAbstract {
	constructor() {
		const entity = MailQueueEntity.NAME;

		super(entity);
	}
}

export const mailQueuePolicy = new MailQueuePolicy();

import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class MailQueuePolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = MailQueueEntity.NAME;

		super(auth, entity);
	}
}

export default MailQueuePolicy;

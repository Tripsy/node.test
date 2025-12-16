import PolicyAbstract from '@/abstracts/policy.abstract';
import { MailQueueQuery } from '@/features/mail-queue/mail-queue.repository';
import type { AuthContext } from '@/types/express';

class MailQueuePolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = MailQueueQuery.entityAlias;

		super(auth, entity);
	}
}

export default MailQueuePolicy;

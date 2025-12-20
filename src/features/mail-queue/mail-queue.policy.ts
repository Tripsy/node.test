import { MailQueueQuery } from '@/features/mail-queue/mail-queue.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class MailQueuePolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = MailQueueQuery.entityAlias;

		super(auth, entity);
	}
}

export default MailQueuePolicy;

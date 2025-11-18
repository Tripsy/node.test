import type { Request } from 'express';
import PolicyAbstract from '@/abstracts/policy.abstract';
import { MailQueueQuery } from '@/features/mail-queue/mail-queue.repository';

class MailQueuePolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = MailQueueQuery.entityAlias;

		super(req, entity);
	}
}

export default MailQueuePolicy;

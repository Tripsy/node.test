import type { Request } from 'express';
import { MailQueueQuery } from '../repositories/mail-queue.repository';
import AbstractPolicy from './abstract.policy';

class MailQueuePolicy extends AbstractPolicy {
	constructor(req: Request) {
		const entity = MailQueueQuery.entityAlias;

		super(req, entity);
	}
}

export default MailQueuePolicy;

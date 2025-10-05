import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import {MailQueueQuery} from '../repositories/mail-queue.repository';

class MailQueuePolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = MailQueueQuery.entityAlias;

        super(req, entity);
    }
}

export default MailQueuePolicy;
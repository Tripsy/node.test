import dataSource from '../config/data-source.config';
import MailQueueEntity from '../entities/mail-queue.entity';
import AbstractQuery from './abstract.query';

export class MailQueueQuery extends AbstractQuery {
    constructor(repository: ReturnType<typeof dataSource.getRepository<MailQueueEntity>>) {
        super(repository, MailQueueRepository.entityAlias);
    }
}

export const MailQueueRepository = dataSource.getRepository(MailQueueEntity).extend({
    entityAlias: 'mail_queue',

    createQuery() {
        return new MailQueueQuery(this);
    },
});

export default MailQueueRepository;

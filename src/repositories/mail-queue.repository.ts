import dataSource from '../config/data-source.config';
import MailQueueEntity from '../entities/mail-queue.entity';
import AbstractQuery from './abstract.query';

export class MailQueueQuery extends AbstractQuery<MailQueueEntity> {
	static entityAlias: string = 'mail_queue';

	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<MailQueueEntity>
		>,
	) {
		super(repository, MailQueueQuery.entityAlias);
	}
}

export const MailQueueRepository = dataSource
	.getRepository(MailQueueEntity)
	.extend({
		createQuery() {
			return new MailQueueQuery(this);
		},
	});

export default MailQueueRepository;

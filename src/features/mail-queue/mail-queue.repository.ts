import RepositoryAbstract from '@/abstracts/repository.abstract';
import dataSource from '@/config/data-source.config';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';

export class MailQueueQuery extends RepositoryAbstract<MailQueueEntity> {
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

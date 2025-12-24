import dataSource from '@/config/data-source.config';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import TemplateEntity from '@/features/template/template.entity';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';

export class MailQueueQuery extends RepositoryAbstract<MailQueueEntity> {
	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<MailQueueEntity>
		>,
	) {
		super(repository, MailQueueEntity.NAME);
	}

	filterByTemplate(term?: string | number): this {
		if (term) {
			if (typeof term === 'number') {
				this.query.andWhere(
					`(
                       ${TemplateEntity.NAME}.id = :id
                    )`,
					{
						id: term,
					},
				);
			} else {
				this.query.andWhere(
					`(
                       ${TemplateEntity.NAME}.label LIKE :label   
                    )`,
					{
						label: `%${term}%`,
					},
				);
			}
		}

		return this;
	}
}

export const getMailQueueRepository = () =>
	dataSource.getRepository(MailQueueEntity).extend({
		createQuery() {
			return new MailQueueQuery(this);
		},
	});

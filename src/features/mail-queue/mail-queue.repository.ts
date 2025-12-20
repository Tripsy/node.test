import dataSource from '@/config/data-source.config';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import { TemplateQuery } from '@/features/template/template.repository';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';

export class MailQueueQuery extends RepositoryAbstract<MailQueueEntity> {
	static entityAlias: string = 'mail_queue';

	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<MailQueueEntity>
		>,
	) {
		super(repository, MailQueueQuery.entityAlias);
	}

	filterByTemplate(term?: string | number): this {
		if (term) {
			if (typeof term === 'number') {
				this.query.andWhere(
					`(
                       ${TemplateQuery.entityAlias}.id = :id
                    )`,
					{
						id: term,
					},
				);
			} else {
				this.query.andWhere(
					`(
                       ${TemplateQuery.entityAlias}.label LIKE :label   
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

import RepositoryAbstract from '@/abstracts/repository.abstract';
import dataSource from '@/config/data-source.config';
import TemplateEntity from '@/features/template/template.entity';

export class TemplateQuery extends RepositoryAbstract<TemplateEntity> {
	static entityAlias: string = 'template';

	constructor(
		repository: ReturnType<typeof dataSource.getRepository<TemplateEntity>>,
	) {
		super(repository, TemplateQuery.entityAlias);
	}

	filterByTerm(term?: string): this {
		if (term) {
			this.query.andWhere(
				`(
                   ${TemplateQuery.entityAlias}.id = :id
                OR ${TemplateQuery.entityAlias}.label LIKE :label    
                OR ${TemplateQuery.entityAlias}.content LIKE :content
            )`,
				{
					id: term,
					label: `%${term}%`,
					content: `%${term}%`,
				},
			);
		}

		return this;
	}
}

export const TemplateRepository = dataSource
	.getRepository(TemplateEntity)
	.extend({
		createQuery() {
			return new TemplateQuery(this);
		},
	});

export default TemplateRepository;

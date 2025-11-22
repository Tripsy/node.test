import RepositoryAbstract from '@/abstracts/repository.abstract';
import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
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
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (term.length > (cfg('filter.termMinLength') as number)) {
					this.filterAny([
						{
							column: 'label',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'content::text',
							value: term,
							operator: 'ILIKE',
						},
					]);
				}
			}
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

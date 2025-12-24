import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
import TemplateEntity from '@/features/template/template.entity';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';

export class TemplateQuery extends RepositoryAbstract<TemplateEntity> {
	constructor(
		repository: ReturnType<typeof dataSource.getRepository<TemplateEntity>>,
	) {
		super(repository, TemplateEntity.NAME);
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

export const getTemplateRepository = () =>
	dataSource.getRepository(TemplateEntity).extend({
		createQuery() {
			return new TemplateQuery(this);
		},
	});

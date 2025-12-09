import RepositoryAbstract from '@/abstracts/repository.abstract';
import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
import DiscountEntity from '@/features/discount/discount.entity';

export class DiscountQuery extends RepositoryAbstract<DiscountEntity> {
	static entityAlias: string = 'discount';

	constructor(
		repository: ReturnType<typeof dataSource.getRepository<DiscountEntity>>,
	) {
		super(repository, DiscountQuery.entityAlias);
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
							column: 'reference',
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

export const DiscountRepository = dataSource
	.getRepository(DiscountEntity)
	.extend({
		createQuery() {
			return new DiscountQuery(this);
		},
	});

export default DiscountRepository;

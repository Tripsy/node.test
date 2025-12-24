import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
import CarrierEntity from '@/features/carrier/carrier.entity';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';

export class CarrierQuery extends RepositoryAbstract<CarrierEntity> {
	constructor(
		repository: ReturnType<typeof dataSource.getRepository<CarrierEntity>>,
	) {
		super(repository, CarrierEntity.NAME);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (term.length > (cfg('filter.termMinLength') as number)) {
					this.filterAny([
						{
							column: 'name',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'website',
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

export const getCarrierRepository = () =>
	dataSource.getRepository(CarrierEntity).extend({
		createQuery() {
			return new CarrierQuery(this);
		},
	});

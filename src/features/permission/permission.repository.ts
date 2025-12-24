import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
import PermissionEntity from '@/features/permission/permission.entity';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';

export class PermissionQuery extends RepositoryAbstract<PermissionEntity> {
	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<PermissionEntity>
		>,
	) {
		super(repository, PermissionEntity.NAME);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (term.length > (cfg('filter.termMinLength') as number)) {
					this.filterAny([
						{
							column: 'entity',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'operation',
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

export const getPermissionRepository = () =>
	dataSource.getRepository(PermissionEntity).extend({
		createQuery() {
			return new PermissionQuery(this);
		},
	});

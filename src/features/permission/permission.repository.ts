import RepositoryAbstract from '@/abstracts/repository.abstract';
import dataSource from '@/config/data-source.config';
import PermissionEntity from '@/features/permission/permission.entity';

export class PermissionQuery extends RepositoryAbstract<PermissionEntity> {
	static entityAlias: string = 'permission';

	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<PermissionEntity>
		>,
	) {
		super(repository, PermissionQuery.entityAlias);
	}

	filterByTerm(term?: string): this {
		if (term) {
			this.query.andWhere(
				`(
                   ${PermissionQuery.entityAlias}.id = :id
                OR ${PermissionQuery.entityAlias}.entity LIKE :entity    
                OR ${PermissionQuery.entityAlias}.operation LIKE :operation
            )`,
				{
					id: term,
					entity: `%${term}%`,
					operation: `%${term}%`,
				},
			);
		}

		return this;
	}
}

export const PermissionRepository = dataSource
	.getRepository(PermissionEntity)
	.extend({
		createQuery() {
			return new PermissionQuery(this);
		},
	});

export default PermissionRepository;

import dataSource from '../config/data-source.config';
import PermissionEntity from '../entities/permission.entity';
import AbstractQuery from './abstract.query';

export class PermissionQuery extends AbstractQuery<PermissionEntity> {
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

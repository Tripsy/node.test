import dataSource from '@/config/data-source.config';
import UserPermissionEntity from '@/features/user-permission/user-permission.entity';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';

export class UserPermissionQuery extends RepositoryAbstract<UserPermissionEntity> {
	static entityAlias: string = 'user_permission';

	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<UserPermissionEntity>
		>,
	) {
		super(repository, UserPermissionQuery.entityAlias);
	}
}

export const UserPermissionRepository = dataSource
	.getRepository(UserPermissionEntity)
	.extend({
		createQuery() {
			return new UserPermissionQuery(this);
		},

		getUserPermissions(user_id: number) {
			return this.createQuery()
				.join('user_permission.permission', 'permission')
				.filterBy('user_permission.user_id', user_id)
				.select(['permission.entity', 'permission.operation'])
				.all(false, true);
		},
	});

export default UserPermissionRepository;

import RepositoryAbstract from '../../abstracts/repository.abstract';
import dataSource from '../../config/data-source.config';
import UserEntity from './user.entity';

export class UserQuery extends RepositoryAbstract<UserEntity> {
	static entityAlias: string = 'user';

	constructor(
		repository: ReturnType<typeof dataSource.getRepository<UserEntity>>,
	) {
		super(repository, UserQuery.entityAlias);
	}

	filterByEmail(email?: string): this {
		if (email) {
			this.hasFilter = true;
			this.filterBy('email', email);
		}

		return this;
	}

	filterByTerm(term?: string): this {
		if (term) {
			this.query.andWhere(
				`(
                   ${UserQuery.entityAlias}.id = :id
                OR ${UserQuery.entityAlias}.name LIKE :name    
                OR ${UserQuery.entityAlias}.email LIKE :email
            )`,
				{
					id: term,
					name: `%${term}%`,
					email: `%${term}%`,
				},
			);
		}

		return this;
	}
}

export const UserRepository = dataSource.getRepository(UserEntity).extend({
	createQuery() {
		return new UserQuery(this);
	},
});

export default UserRepository;

import type { Repository } from 'typeorm/repository/Repository';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import UserEntity from '@/features/user/user.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class UserQuery extends RepositoryAbstract<UserEntity> {
	constructor(repository: Repository<UserEntity>) {
		super(repository, UserEntity.NAME);
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
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (
					term.length >
					(Configuration.get('filter.termMinLength') as number)
				) {
					this.filterAny([
						{
							column: 'name',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'email',
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

export const getUserRepository = () =>
	dataSource.getRepository(UserEntity).extend({
		createQuery() {
			return new UserQuery(this);
		},
	});

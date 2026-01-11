import type { Repository } from 'typeorm/repository/Repository';
import { getDataSource } from '@/config/data-source.config';
import AccountTokenEntity from '@/features/account/account-token.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class AccountTokenQuery extends RepositoryAbstract<AccountTokenEntity> {
	constructor(repository: Repository<AccountTokenEntity>) {
		super(repository, AccountTokenEntity.NAME);
	}

	filterByIdent(ident: string): this {
		this.hasFilter = true;

		return this.filterBy('ident', ident);
	}
}

export const getAccountTokenRepository = () =>
	getDataSource()
		.getRepository(AccountTokenEntity)
		.extend({
			createQuery() {
				return new AccountTokenQuery(this);
			},

			removeTokenById(id: number): void {
				void this.createQuery().filterById(id).delete(false);
			},
		});

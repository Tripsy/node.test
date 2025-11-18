import RepositoryAbstract from '../../abstracts/repository.abstract';
import dataSource from '../../config/data-source.config';
import AccountRecoveryEntity from './account-recovery.entity';

export class AccountRecoveryQuery extends RepositoryAbstract<AccountRecoveryEntity> {
	static entityAlias: string = 'account_recovery';

	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<AccountRecoveryEntity>
		>,
	) {
		super(repository, AccountRecoveryQuery.entityAlias);
	}

	filterByIdent(ident: string): this {
		this.hasFilter = true;

		return this.filterBy('ident', ident);
	}
}

export const AccountRecoveryRepository = dataSource
	.getRepository(AccountRecoveryEntity)
	.extend({
		createQuery() {
			return new AccountRecoveryQuery(this);
		},

		// removeRecoveryById(id: number): void {
		//     void this.createQuery()
		//         .filterById(id)
		//         .delete(false);
		// }
	});

export default AccountRecoveryRepository;

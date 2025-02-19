import dataSource from '../config/data-source.config';
import AbstractQuery from './abstract.query';
import AccountRecoveryEntity from '../entities/account-recovery.entity';

export class AccountRecoveryQuery extends AbstractQuery {
    constructor(repository: ReturnType<typeof dataSource.getRepository<AccountRecoveryEntity>>) {
        super(repository, AccountRecoveryRepository.entityAlias);
    }

    filterByIdent(ident: string): this {
        this.hasFilter = true;

        return this.filterBy('ident', ident);
    }
}

export const AccountRecoveryRepository = dataSource.getRepository(AccountRecoveryEntity).extend({
    entityAlias: 'account_recovery',

    createQuery() {
        return new AccountRecoveryQuery(this);
    },

    removeRecoveryById(id: number): void {
        void this.createQuery()
            .filterById(id)
            .delete(false);
    }
});

export default AccountRecoveryRepository;

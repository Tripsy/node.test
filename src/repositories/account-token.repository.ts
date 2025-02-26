import dataSource from '../config/data-source.config';
import AbstractQuery from './abstract.query';
import AccountTokenEntity from '../entities/account-token.entity';

export class AccountTokenQuery extends AbstractQuery {
    static entityAlias: string = 'account_token';
    
    constructor(repository: ReturnType<typeof dataSource.getRepository<AccountTokenEntity>>) {
        super(repository, AccountTokenQuery.entityAlias);
    }

    filterByIdent(ident: string): this {
        this.hasFilter = true;

        return this.filterBy('ident', ident);
    }
}

export const AccountTokenRepository = dataSource.getRepository(AccountTokenEntity).extend({
    createQuery() {
        return new AccountTokenQuery(this);
    },

    removeTokenById(id: number): void {
        void this.createQuery()
            .filterById(id)
            .delete(false);
    }
});

export default AccountTokenRepository;

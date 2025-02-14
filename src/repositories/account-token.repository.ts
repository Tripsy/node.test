import dataSource from '../config/init-database.config';
import AbstractQuery from './abstract.query';
import AccountTokenEntity from '../entities/account_token.entity';

export class AccountTokenQuery extends AbstractQuery {
    constructor(repository: ReturnType<typeof dataSource.getRepository<AccountTokenEntity>>) {
        super(repository, AccountTokenRepository.entityAlias);
    }
}

export const AccountTokenRepository = dataSource.getRepository(AccountTokenEntity).extend({
    entityAlias: 'account_token',

    createQuery() {
        return new AccountTokenQuery(this);
    },
});


export default AccountTokenRepository;

import dataSource from '../config/data-source.config';
import UserEntity from '../entities/user.entity';
import AbstractQuery from './abstract.query';

export class UserQuery extends AbstractQuery {
    static entityAlias: string = 'user';
    
    constructor(repository: ReturnType<typeof dataSource.getRepository<UserEntity>>) {
        super(repository, UserQuery.entityAlias);
    }

    filterByEmail(email?: string): this {
        if (email) {
            this.hasFilter = true;
            this.filterBy('email', email);
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

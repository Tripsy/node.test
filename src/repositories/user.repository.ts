import dataSource from '../config/data-source.config';
import UserEntity from '../entities/user.entity';
import AbstractQuery from './abstract.query';

export class UserQuery extends AbstractQuery {
    constructor(repository: ReturnType<typeof dataSource.getRepository<UserEntity>>) {
        super(repository, UserRepository.entityAlias);
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
    entityAlias: 'user',

    createQuery() {
        return new UserQuery(this);
    },
});


export default UserRepository;

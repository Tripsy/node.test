import dataSource from '../config/init-database.config';
import UserEntity from '../entities/user.entity';
import AbstractQuery from './abstract.query';

export class UserQuery extends AbstractQuery {
    constructor(repository: ReturnType<typeof dataSource.getRepository<UserEntity>>) {
        super(repository, UserRepository.entityAlias);
    }

    filterByName(name?: string) {
        if (name) {
            this.hasFilter = true;
            this.query.andWhere(`${this.entityAlias}.name = :name`, {name});
        }

        return this;
    }

    filterByEmail(email?: string): this {
        if (email) {
            this.hasFilter = true;
            this.query.andWhere(`${UserRepository.entityAlias}.email = :email`, { email });
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

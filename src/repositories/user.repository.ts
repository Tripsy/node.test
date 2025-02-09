import dataSource from '../config/init-database.config';
import UserEntity from '../entities/user.entity';
import AbstractQuery from './abstract.query';

export class UserReadQuery extends AbstractQuery {
    constructor(private repository: ReturnType<typeof dataSource.getRepository<UserEntity>>) {
        super(repository.createQueryBuilder(UserRepository.entityAlias), UserRepository.entityAlias);
    }

    filterByEmail(email: string): this {
        if (email) {
            this.query.andWhere(`${UserRepository.entityAlias}.email = :email`, { email });
        }
        return this;
    }
}

export const UserRepository = dataSource.getRepository(UserEntity).extend({
    entityAlias: 'user',

    createReadQuery() {
        return new UserReadQuery(this);
    },
});


export default UserRepository;

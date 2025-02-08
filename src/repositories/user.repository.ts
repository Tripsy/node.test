import dataSource from '../config/init-database.config';
import UserEntity from '../entities/user.entity';
import AbstractQuery from './abstract.query';

const UserRepository = dataSource.getRepository(UserEntity).extend({
    // async findByEmail(email: string): Promise<UserEntity | null> {
    //     return this.createQueryBuilder("user")
    //         .where("user.email = :email", {email})
    //         .getOne();
    // }
    // findByName(name: string, status: string) {
    //     return this.createQueryBuilder("user")
    //         .where("user.name = :name", { name })
    //         .andWhere("user.status = :status", { status })
    //         .getMany();
    // },
})

export class UserReadQuery extends AbstractQuery {
    private entityAlias: string = 'user';
    private query = UserRepository.createQueryBuilder(this.entityAlias);

    filterByEmail(email: string) {
        if (email) {
            this.query.andWhere(`${this.entityAlias}.email = :email`, {email});
        }

        return this;
    }
}

export default UserRepository;

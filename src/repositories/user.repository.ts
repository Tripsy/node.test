import {Repository} from 'typeorm';
import dataSource from '../config/init-database.config';
import UserEntity from '../entities/user.entity';

export const userRepository: Repository<UserEntity> = dataSource.getRepository(UserEntity).extend({
    findByName(firstName: string, lastName: string) {
        return this.createQueryBuilder("user")
            .where("user.firstName = :firstName", { firstName })
            .andWhere("user.lastName = :lastName", { lastName })
            .getMany();
    },
});

export default userRepository;

import {Repository} from 'typeorm';
import AppDataSource from '../config/data-source';
import UserEntity from '../entities/user.entity';

export const userRepository: Repository<UserEntity> = AppDataSource.getRepository(UserEntity).extend({
    findByName(firstName: string, lastName: string) {
        return this.createQueryBuilder("user")
            .where("user.firstName = :firstName", { firstName })
            .andWhere("user.lastName = :lastName", { lastName })
            .getMany();
    },
});

export default userRepository;

import {Repository} from 'typeorm'
import AppDataSource from '../config/data-source'
import User from '../entities/User'

export const userRepository: Repository<User> = AppDataSource.getRepository(User).extend({
    findByName(firstName: string, lastName: string) {
        return this.createQueryBuilder("user")
            .where("user.firstName = :firstName", { firstName })
            .andWhere("user.lastName = :lastName", { lastName })
            .getMany()
    },
})

export default userRepository

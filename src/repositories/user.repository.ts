import dataSource from '../config/init-database.config';
import UserEntity from '../entities/user.entity';

export const UserRepository = dataSource.getRepository(UserEntity).extend({
    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.createQueryBuilder("user")
            .where("user.email = :email", { email })
            .getOne();
    }
    // findByName(name: string, status: string) {
    //     return this.createQueryBuilder("user")
    //         .where("user.name = :name", { name })
    //         .andWhere("user.status = :status", { status })
    //         .getMany();
    // },
})

export default UserRepository;


export class ProjectReadQuery {
    private query = projectRepository.createQueryBuilder('project');

    filterByAuthorityName(authorityName: string) {
        this.query.andWhere('project.authorityName = :authorityName', { authorityName });
        return this;
    }

    filterByName(name: string) {
        this.query.andWhere('project.name = :name', { name });
        return this;
    }

    async firstOrFail() {
        const project = await this.query.getOne();
        if (!project) {
            throw new Error('Project not found');
        }
        return project;
    }
}

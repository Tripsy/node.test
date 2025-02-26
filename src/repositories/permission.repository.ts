import dataSource from '../config/data-source.config';
import PermissionEntity from '../entities/permission.entity';
import AbstractQuery from './abstract.query';

export class PermissionQuery extends AbstractQuery {
    static entityAlias: string = 'permission';
    
    constructor(repository: ReturnType<typeof dataSource.getRepository<PermissionEntity>>) {
        super(repository, PermissionQuery.entityAlias);
    }
}

export const PermissionRepository = dataSource.getRepository(PermissionEntity).extend({
    createQuery() {
        return new PermissionQuery(this);
    },
});

export default PermissionRepository;

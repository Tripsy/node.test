import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import {PermissionQuery} from '../repositories/permission.repository';

class PermissionPolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = PermissionQuery.entityAlias;

        super(req, entity);
    }
}

export default PermissionPolicy;
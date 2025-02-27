import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import {UserQuery} from '../repositories/user.repository';

class UserPolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = UserQuery.entityAlias;

        super(req, entity);
    }
}

export default UserPolicy;
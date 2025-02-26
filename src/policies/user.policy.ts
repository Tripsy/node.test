import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import {UserQuery} from '../repositories/user.repository';

class UserPolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = UserQuery.entityAlias;

        super(req, entity);
    }

    public updateStatus(): void {
        const permission: string = this.permission('updateStatus', this.entity);

        if (!this.isAllowed(permission)) {
            this.useError();
        }
    }
}

export default UserPolicy;
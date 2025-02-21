import {Request} from 'express';
import AbstractPolicy from './abstract.policy';

class UserPolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = 'user';

        super(req, entity);
    }

    public updateStatus(): void {
        const permission = `${this.entity}.updateStatus`;

        if (!this.isAllowed(permission)) {
            this.useError();
        }
    }
}

export default UserPolicy;
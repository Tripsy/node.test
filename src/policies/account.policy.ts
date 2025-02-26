import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import UnauthorizedError from '../exceptions/unauthorized.error';

class AccountPolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = 'account';

        super(req, entity);
    }

    public passwordUpdate(): void {
        if (!this.isAuthenticated()) {
            throw new UnauthorizedError();
        }
    }

    public emailUpdate(): void {
        if (!this.isAuthenticated()) {
            throw new UnauthorizedError();
        }
    }
}

export default AccountPolicy;
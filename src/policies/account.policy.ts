import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import UnauthorizedError from '../exceptions/unauthorized.error';
import NotAllowedError from '../exceptions/not-allowed.error';
import {lang} from '../config/i18n-setup.config';

class AccountPolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = 'account';

        super(req, entity);
    }

    public register(): void {
        if (this.isAuthenticated()) {
            throw new NotAllowedError(lang('account.error.already_logged_in'));
        }
    }

    public login(): void {
        if (this.isAuthenticated()) {
            throw new NotAllowedError(lang('account.error.already_logged_in'));
        }
    }

    public logout(): void {
        if (!this.isAuthenticated()) {
            throw new NotAllowedError(lang('account.error.not_logged_in'));
        }
    }

    public passwordRecover(): void {
        if (this.isAuthenticated()) {
            throw new NotAllowedError(lang('account.error.already_logged_in'));
        }
    }

    public passwordRecoverChange(): void {
        if (this.isAuthenticated()) {
            throw new NotAllowedError(lang('account.error.already_logged_in'));
        }
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
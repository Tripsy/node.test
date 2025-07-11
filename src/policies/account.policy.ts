import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import UnauthorizedError from '../exceptions/unauthorized.error';
import {lang} from '../config/i18n-setup.config';
import {settings} from '../config/settings.config';
import CustomError from '../exceptions/custom.error';
import {getRedisClient} from '../config/init-redis.config';
import logger from '../providers/logger.provider';

class AccountPolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = 'account';

        super(req, entity);
    }

    public register(): void {
        if (this.isAuthenticated()) {
            throw new CustomError(406, lang('account.error.already_logged_in'));
        }
    }

    public login(): void {
        if (this.isAuthenticated()) {
            throw new CustomError(406, lang('account.error.already_logged_in'));
        }
    }

    public logout(): void {
        if (!this.isAuthenticated()) {
            throw new UnauthorizedError(lang('account.error.not_logged_in'));
        }
    }

    public passwordRecover(): void {
        if (this.isAuthenticated()) {
            throw new CustomError(406, lang('account.error.already_logged_in'));
        }
    }

    public passwordRecoverChange(): void {
        if (this.isAuthenticated()) {
            throw new CustomError(406, lang('account.error.already_logged_in'));
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

    public details(): void {
        if (!this.isAuthenticated()) {
            throw new UnauthorizedError();
        }
    }

    public async checkRateLimitOnLogin(ipKey: string, emailKey: string): Promise<void> {
        const redisClient = getRedisClient();

        const [ipAttempts, emailAttempts] = await Promise.all([
            redisClient.get(ipKey),
            redisClient.get(emailKey),
        ]);

        const ipAttemptCount = ipAttempts ? parseInt(ipAttempts, 10) : 0;
        const emailAttemptCount = emailAttempts ? parseInt(emailAttempts, 10) : 0;

        if (ipAttemptCount >= settings.user.loginMaxFailedAttemptsForIp || emailAttemptCount >= settings.user.loginMaxFailedAttemptsForEmail) {
            throw new CustomError(429, lang('account.error.too_many_login_attempts'));
        }
    }

    public async updateFailedAttemptsOnLogin(ipKey: string, emailKey: string): Promise<void> {
        try {
            const redisClient = getRedisClient();

            // Increment the failed attempt count
            await redisClient.incr(ipKey);
            await redisClient.incr(emailKey);

            // Set an expiration time on the keys
            await redisClient.expire(ipKey, settings.user.LoginFailedAttemptsLockTime);
            await redisClient.expire(emailKey, settings.user.LoginFailedAttemptsLockTime);
        } catch (error) {
            logger.error(`Failed to update failed login attempts`, error);
        }
    }
}

export default AccountPolicy;
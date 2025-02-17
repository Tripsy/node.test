import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import UserRepository from '../repositories/user.repository';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import AccountLoginValidator from '../validators/account-login.validator';
import {UserStatusEnum} from '../enums/user-status.enum';
import NotFoundError from '../exceptions/not-found.error';
import UnauthorizedError from '../exceptions/unauthorized.error';
import {buildMetadata, getAuthValidTokens, setupRecovery, setupToken, verifyPassword} from '../services/account.service';
import {settings} from '../config/settings.config';
import AccountTokenRepository from '../repositories/account-token.repository';
import AccountRemoveTokenValidator from '../validators/account-remove-token.validator';
import AccountPasswordRecoverValidator from '../validators/account-password-recover.validator';
import AccountRecoveryRepository from '../repositories/account-recovery.repository';
import {createPastDate} from '../helpers/utils';
import {prepareEmailContent, queueEmail} from '../providers/email.provider';
import {EmailContent} from '../types/email-content.type';
import AccountPasswordChangeValidator from '../validators/account-password-change.validator';
import {compareMetadataValue} from '../helpers/metadata';
import {AuthValidToken} from '../types/token.type';

class AccountController {
    public login = asyncHandler(async (req: Request, res: Response) => {
        // Validate the request body against the schema
        const validated = AccountLoginValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const user = await UserRepository.createQuery()
            .select(['id', 'password', 'status'])
            .filterByEmail(validated.data.email)
            .firstOrFail();

        if (user.status !== UserStatusEnum.ACTIVE) {
            throw new NotFoundError(lang('account.error.not_active'));
        }

        const isValidPassword: boolean = await verifyPassword(validated.data.password, user.password);

        if (!isValidPassword) {
            throw new UnauthorizedError(lang('account.error.not_authorized'));
        }

        const authValidTokens: AuthValidToken[] = await getAuthValidTokens(user.id);

        if (authValidTokens.length >= settings.user.maxActiveSessions) {
            res.status(403); // Forbidden - client's identity is known to the server
            res.output.message(lang('account.error.max_active_sessions'));
            res.output.data({
                'authValidTokens': authValidTokens
            });
        } else {
            const token = await setupToken(user, req);

            res.output.message(lang('account.success.login'));
            res.output.data({
                'token': token
            });
        }

        res.json(res.output);
    });

    public removeToken = asyncHandler(async (req: Request, res: Response) => {
        // Validate the request body against the schema
        const validated = AccountRemoveTokenValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        await AccountTokenRepository.createQuery()
            .filterByIdent(validated.data.ident)
            .delete(false);

        res.output.message(lang('account.success.token_deleted'));

        res.json(res.output);
    });

    public logout = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) {
            throw new BadRequestError(lang('account.error.not_logged_in'));
        }

        try {
            await AccountTokenRepository.createQuery()
                .filterBy('user_id', req.user.id)
                .delete(false, true);
        } catch (error) {
            if (!(error instanceof NotFoundError)) {
                throw error;
            }
        }

        res.output.message(lang('account.success.logout'));

        res.json(res.output);
    });

    public passwordRecover = asyncHandler(async (req: Request, res: Response) => {
        // Validate the request body against the schema
        const validated = AccountPasswordRecoverValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const user = await UserRepository.createQuery()
            .select(['id', 'name', 'email', 'language', 'status'])
            .filterByEmail(validated.data.email)
            .firstOrFail();

        if (user.status !== UserStatusEnum.ACTIVE) {
            throw new NotFoundError(lang('account.error.not_active'));
        }

        const countRecoveryAttempts: number = await AccountRecoveryRepository.createQuery()
            .select(['id'])
            .filterBy('user_id', user.id)
            .filterByRange('created_at', createPastDate(6 * 60 * 60)) // Last 6 hours
            .count();

        if (countRecoveryAttempts >= settings.user.recoveryAttemptsInLastSixHours) {
            throw new BadRequestError(lang('account.error.recovery_attempts_exceeded'));
        }

        const [ident, expire_at] = await setupRecovery(user, req);

        const emailContent: EmailContent = prepareEmailContent('password-recover', user.language || req.lang, {
            'name': user.name,
            'ident': ident,
            'expire_at': expire_at.toISOString()
        });

        void queueEmail(emailContent, {
            name: user.name,
            address: user.email
        });

        res.output.message(lang('account.success.password_recover'));

        res.json(res.output);
    });

    public passwordChange = asyncHandler(async (req: Request, res: Response) => {
        const ident = req.params.ident;

        if (!ident) {
            throw new BadRequestError(lang('account.error.recovery_token_not_found'));
        }

        // Validate the request body against the schema
        const validated = AccountPasswordChangeValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        console.log(ident)

        const recovery = await AccountRecoveryRepository.createQuery()
            .select(['id', 'user_id', 'metadata', 'used_at', 'expire_at'])
            .filterByIdent(ident)
            .firstOrFail();

        if (recovery.used_at) {
            throw new BadRequestError(lang('account.error.recovery_token_used'));
        }

        if (recovery.expire_at < new Date()) {
            throw new BadRequestError(lang('account.error.recovery_token_expired'));
        }

        if (settings.user.recoveryEnableMetadataCheck) {
            // Validate metadata (e.g., user-agent check)
            if (!compareMetadataValue(recovery.metadata, buildMetadata(req), 'user-agent')) {
                throw new BadRequestError(lang('account.error.recovery_token_not_authorized'));
            }
        }

        const user = await UserRepository.createQuery()
            .select(['id', 'name', 'email', 'language', 'status'])
            .filterById(recovery.user_id)
            .first();

        // User not found or inactive
        if (!user || user.status !== UserStatusEnum.ACTIVE) {
            throw new NotFoundError(lang('account.error.not_found'));
        }

        // Update user password
        user.password = validated.data.password;
        await UserRepository.save(user);

        // Remove all account tokens
        await AccountTokenRepository.createQuery()
            .filterBy('user_id', recovery.user_id)
            .delete(false, true);

        // Mark recovery token as used
        await AccountRecoveryRepository.update(recovery.id, {
            used_at: new Date(),
        });

        const emailContent: EmailContent = prepareEmailContent('password-change', user.language || req.lang, {
            'name': user.name
        });

        void queueEmail(emailContent, {
            name: user.name,
            address: user.email
        });

        res.output.message(lang('account.success.password_changed'));

        res.json(res.output);
    });
}

export default new AccountController();

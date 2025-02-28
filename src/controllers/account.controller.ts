import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import UserRepository from '../repositories/user.repository';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import AccountLoginValidator from '../validators/account-login.validator';
import {UserStatusEnum} from '../enums/user-status.enum';
import NotFoundError from '../exceptions/not-found.error';
import UnauthorizedError from '../exceptions/unauthorized.error';
import {
    buildMetadata,
    getAuthValidTokens,
    sendEmailConfirmUpdate,
    setupRecovery,
    setupToken,
    verifyPassword
} from '../services/account.service';
import {settings} from '../config/settings.config';
import AccountTokenRepository from '../repositories/account-token.repository';
import AccountRemoveTokenValidator from '../validators/account-remove-token.validator';
import AccountPasswordRecoverValidator from '../validators/account-password-recover.validator';
import AccountRecoveryRepository from '../repositories/account-recovery.repository';
import {createPastDate} from '../helpers/utils';
import {loadEmailTemplate, queueEmail} from '../providers/email.provider';
import AccountPasswordRecoverChangeValidator from '../validators/account-password-recover-change.validator';
import {compareMetadataValue} from '../helpers/metadata';
import {AuthValidToken, ConfirmationTokenPayload} from '../types/token.type';
import jwt from 'jsonwebtoken';
import NotAllowedError from '../exceptions/not-allowed.error';
import {EmailTemplate} from '../types/template.type';
import AccountPolicy from '../policies/account.policy';
import AccountPasswordUpdateValidator from '../validators/account-password-update.validator';
import CustomError from '../exceptions/custom.error';
import AccountEmailUpdateValidator from '../validators/account-email-update.validator';
import UserEntity from '../entities/user.entity';
import AccountRegisterValidator from '../validators/account-register.validator';
import {getClientIp} from '../helpers/system';

class AccountController {
    public register = asyncHandler(async (req: Request, res: Response) => {
        const policy = new AccountPolicy(req);

        // Check permission (should not be authenticated)
        policy.register();

        // Validate the request body against the schema
        const validated = AccountRegisterValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const existingUser = await UserRepository.createQuery()
            .filterByEmail(validated.data.email)
            .first();

        if (existingUser) {
            throw new CustomError(409, lang('account.error.email_already_used'));
        }

        const user = new UserEntity();
        user.name = validated.data.name;
        user.email = validated.data.email;
        user.password = validated.data.password;
        user.language = validated.data.language || req.lang;

        const entry: UserEntity = await UserRepository.save(user);

        res.output.data(entry);
        res.output.message(lang('account.success.register'));

        res.json(res.output);
    }); // TODO test

    public login = asyncHandler(async (req: Request, res: Response) => {
        const policy = new AccountPolicy(req);

        // Check permission (should not be authenticated)
        policy.login();

        // Validate the request body against the schema
        const validated = AccountLoginValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const ipKey = 'failed_login:ip:' + getClientIp(req);
        const emailKey = `failed_login:email:${validated.data.email}`;

        await policy.checkRateLimitOnLogin(ipKey, emailKey);

        const user = await UserRepository.createQuery()
            .select(['id', 'password', 'status'])
            .filterByEmail(validated.data.email)
            .firstOrFail();

        if (user.status !== UserStatusEnum.ACTIVE) {
            throw new NotFoundError(lang('account.error.not_active'));
        }

        const isValidPassword: boolean = await verifyPassword(validated.data.password, user.password);

        if (!isValidPassword) {
            // Update failed login attempts
            await policy.updateFailedAttemptsOnLogin(ipKey, emailKey);

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
    }); // TODO test

    /**
     * With this endpoint account tokens can be removed
     * It is allowed to be used authenticated or not; "safety" is only guaranteed by the ident parameter which is hard to guess
     *
     * Practical aspects:
     *      - On login (with valid credentials) if too many sessions are active a list of tokens will be returned
     *        in the response -> front-end implementation can allow token(s) to be removed before login retry
     *      - From his account page user could see all active tokens and allow removal
     */
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
    }); // TODO test

    public logout = asyncHandler(async (req: Request, res: Response) => {
        const policy = new AccountPolicy(req);

        // Check permission (should be authenticated)
        policy.logout();

        try {
            await AccountTokenRepository.createQuery()
                .filterBy('user_id', policy.getUserId())
                .delete(false, true);
        } catch (error) {
            if (!(error instanceof NotFoundError)) {
                throw error;
            }
        }

        res.output.message(lang('account.success.logout'));

        res.json(res.output);
    }); // TODO test

    public passwordRecover = asyncHandler(async (req: Request, res: Response) => {
        const policy = new AccountPolicy(req);

        // Check permission (should not be authenticated)
        policy.passwordRecover();

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

        const emailTemplate: EmailTemplate = await loadEmailTemplate('password-recover', user.language || req.lang);

        void queueEmail(
            emailTemplate,
            {
                'name': user.name,
                'ident': ident,
                'expire_at': expire_at.toISOString()
            },
            {
                name: user.name,
                address: user.email
            });

        res.output.message(lang('account.success.password_recover'));

        res.json(res.output);
    }); // TODO test

    public passwordRecoverChange = asyncHandler(async (req: Request, res: Response) => {
        const policy = new AccountPolicy(req);

        // Check permission (should not be authenticated)
        policy.passwordRecoverChange();

        const ident = req.params.ident;

        if (!ident) {
            throw new BadRequestError(lang('account.error.recovery_token_not_found'));
        }

        // Validate the request body against the schema
        const validated = AccountPasswordRecoverChangeValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

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

        const emailTemplate: EmailTemplate = await loadEmailTemplate('password-change', user.language || req.lang);

        void queueEmail(
            emailTemplate,
            {
                'name': user.name
            },
            {
                name: user.name,
                address: user.email
            }
        );

        res.output.message(lang('account.success.password_changed'));

        res.json(res.output);
    }); // TODO test

    public passwordUpdate = asyncHandler(async (req: Request, res: Response) => {
        const policy = new AccountPolicy(req);

        // Check permission (needs to be authenticated)
        policy.passwordUpdate();

        // Validate the request body against the schema
        const validated = AccountPasswordUpdateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const user = await UserRepository.createQuery()
            .select(['id', 'password'])
            .filterById(policy.getUserId())
            .firstOrFail();

        const isValidPassword: boolean = await verifyPassword(validated.data.old_password, user.password);

        if (!isValidPassword) {
            res.output.errors([
                {'old_password': lang('account.validation.old_password_invalid')}
            ]);

            throw new BadRequestError();
        }

        // Update user password
        user.password = validated.data.password;
        await UserRepository.save(user);

        // Remove all account tokens
        await AccountTokenRepository.createQuery()
            .filterBy('user_id', policy.getUserId())
            .delete(false, true);

        // Generate new token
        const token = await setupToken(user, req);

        res.output.message(lang('account.success.password_updated'));
        res.output.data({
            'token': token
        }); // TODO test

        res.json(res.output);
    });

    /**
     * This endpoint is used to confirm user email after account registration or email update
     * It is allowed to be used authenticated or not; "safety" is guaranteed by the token parameter which is pretty much impossible to guess
     * & "Yes" - based on implementation (maybe auto-login on registration) - confirmation can take place even if logged in
     */
    public emailConfirm = asyncHandler(async (req: Request, res: Response) => {
        const token = req.params.token;

        if (!token) {
            throw new BadRequestError(lang('account.error.confirmation_token_not_found'));
        }

        // Verify JWT and extract payload
        let payload: ConfirmationTokenPayload;

        try {
            payload = jwt.verify(token, settings.user.emailConfirmationSecret) as ConfirmationTokenPayload;
        } catch (err) {
            throw new BadRequestError(lang('account.error.confirmation_token_invalid'));
        }

        const user = await UserRepository.createQuery()
            .select(['id', 'status'])
            .filterById(payload.user_id)
            .filterByEmail(payload.user_email)
            .first();

        // User not found
        if (!user) {
            throw new NotFoundError(lang('account.error.not_found'));
        }

        if (payload.user_email_new) {
            // Confirm procedure for email update
            user.email = payload.user_email_new;
            await UserRepository.save(user);

            res.output.message(lang('account.success.email_updated'));
        } else {
            // Confirm procedure for email confirmation
            switch (user.status) {
                case UserStatusEnum.ACTIVE:
                    throw new BadRequestError(lang('account.error.already_active'));
                case UserStatusEnum.INACTIVE:
                    throw new NotAllowedError();
            }

            // Update user status
            user.status = UserStatusEnum.ACTIVE;
            await UserRepository.save(user);

            res.output.message(lang('account.success.email_confirmed'));
        }

        res.json(res.output);
    });

    public emailUpdate = asyncHandler(async (req: Request, res: Response) => {
        const policy = new AccountPolicy(req);

        // Check permission (needs to be authenticated)
        policy.emailUpdate();

        // Validate the request body against the schema
        const validated = AccountEmailUpdateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const existingUser = await UserRepository.createQuery()
            .filterBy('id', policy.getUserId(), '!=')
            .filterByEmail(validated.data.email)
            .first();

        // Return error if email already in use by another account
        if (existingUser) {
            throw new CustomError(409, lang('account.error.email_already_used'));
        }

        const user = await UserRepository.createQuery()
            .select(['id', 'name', 'email', 'language'])
            .filterById(policy.getUserId())
            .firstOrFail();

        // Return error if email is the same
        if (user.email === validated.data.email) {
            throw new CustomError(409, lang('account.error.email_same'));
        }

        // Add new email to user entity (added in the confirmation token payload)
        user.email_new = validated.data.email;

        // Send confirmation email
        await sendEmailConfirmUpdate(user);

        res.output.message(lang('account.success.email_update'));

        res.json(res.output);
    }); // TODO test
}

export default new AccountController();

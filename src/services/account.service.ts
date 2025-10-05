import bcrypt from 'bcrypt';
import UserEntity from '../entities/user.entity';
import jwt from 'jsonwebtoken';
import {cfg} from '../config/settings.config';
import {v4 as uuid} from 'uuid';
import AccountTokenEntity from '../entities/account-token.entity';
import AccountTokenRepository from '../repositories/account-token.repository';
import {Request} from 'express';
import {AuthTokenPayload, ConfirmationTokenPayload, AuthValidToken} from '../types/token.type';
import {getMetaDataValue, tokenMetaData} from '../helpers/meta-data.helper';
import AccountRecoveryEntity from '../entities/account-recovery.entity';
import AccountRecoveryRepository from '../repositories/account-recovery.repository';
import {loadEmailTemplate, queueEmail} from '../providers/email.provider';
import {EmailTemplate} from '../types/template.type';
import {createFutureDate} from '../helpers/date.helper';
import {getErrorMessage} from '../helpers/system.helper';

export async function encryptPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

export function readToken(req: Request): string | undefined {
    return req.headers.authorization?.split(' ')[1];
}

export async function getActiveAuthToken(req: Request): Promise<AccountTokenEntity> {
    // Read the token from the request
    const token: string | undefined = readToken(req);

    if (!token) {
        throw new Error('Token not found');
    }

    // Verify JWT and extract payload
    let payload: AuthTokenPayload;

    try {
        payload = jwt.verify(token, cfg('user.authSecret')) as AuthTokenPayload;
    } catch (err) {
        throw new Error('Unable to verify token: ' + getErrorMessage(err));
    }

    const activeToken = await AccountTokenRepository.createQuery()
        .select(['id', 'metadata', 'expire_at'])
        .filterByIdent(payload.ident)
        .filterBy('user_id', payload.user_id)
        .first();

    if (!activeToken) {
        throw new Error('No active token found');
    }

    return activeToken;
}

export function createAuthToken(user: Partial<UserEntity> & { id: number }): {
    token: string,
    ident: string,
    expire_at: Date
} {
    if (!user.id) {
        throw new Error('User object must contain `id` property.');
    }

    const ident: string = uuid();
    const expire_at: Date = createFutureDate(cfg('user.authExpiresIn'));

    const payload: AuthTokenPayload = {
        user_id: user.id,
        ident: ident
    };

    const token = jwt.sign(payload, cfg('user.authSecret'));

    return {token, ident, expire_at};
}

export async function setupToken(user: Partial<UserEntity> & { id: number }, req: Request): Promise<string> {
    const {token, ident, expire_at} = createAuthToken(user);

    const accountTokenEntity = new AccountTokenEntity();
    accountTokenEntity.user_id = user.id;
    accountTokenEntity.ident = ident;
    accountTokenEntity.metadata = tokenMetaData(req);
    accountTokenEntity.used_at = new Date();
    accountTokenEntity.expire_at = expire_at;

    await AccountTokenRepository.save(accountTokenEntity);

    return token;
}

export async function getAuthValidTokens(user_id: number): Promise<AuthValidToken[]> {
    const authValidTokens = await AccountTokenRepository.createQuery()
        .select(['id', 'ident', 'metadata', 'used_at'])
        .filterBy('user_id', user_id)
        .filterByRange('expire_at', new Date())
        .all();

    return authValidTokens.map(token => {
        return {
            ident: token.ident,
            label: getMetaDataValue(token.metadata, 'user-agent'),
            used_at: token.used_at
        };
    });
}

export async function setupRecovery(user: Partial<UserEntity> & { id: number }, req: Request): Promise<[string, Date]> {
    const ident: string = uuid();
    const expire_at = createFutureDate(cfg('user.recoveryIdentExpiresIn'));

    const accountRecoveryEntity = new AccountRecoveryEntity();
    accountRecoveryEntity.user_id = user.id;
    accountRecoveryEntity.ident = uuid();
    accountRecoveryEntity.metadata = tokenMetaData(req);
    accountRecoveryEntity.expire_at = expire_at;

    await AccountRecoveryRepository.save(accountRecoveryEntity);

    return [ident, expire_at];
}

/**
 * This method has a double utility:
 *  - creates a JWT token which is used to confirm the email address of the user on account creation
 *  - creates a JWT token which is used to confirm the email address of the user on email update
 *
 * @param user
 */
export function createConfirmationToken(user: Partial<UserEntity> & {
    id: number;
    email: string;
    email_new?: string
}): {
    token: string,
    expire_at: Date
} {
    if (!user.id || !user.email) {
        throw new Error('User object must contain both `id` and `email` properties.');
    }

    const payload: ConfirmationTokenPayload = {
        user_id: user.id,
        user_email: user.email,
        user_email_new: user.email_new
    };

    const token = jwt.sign(payload, cfg('user.emailConfirmationSecret'), {
        expiresIn: cfg('user.emailConfirmationExpiresIn') * 86400
    });

    const expire_at = createFutureDate(cfg('user.emailConfirmationExpiresIn') * 86400);

    return {token, expire_at};
}

export async function sendEmailConfirmCreate(user: Partial<UserEntity> & {
    id: number,
    name: string,
    email: string,
    language: string
}): Promise<void> {
    const {token, expire_at} = createConfirmationToken(user);

    const emailTemplate: EmailTemplate = await loadEmailTemplate('email-confirm-create', user.language);

    emailTemplate.content.vars = {
        name: user.name,
        token: token,
        expire_at: expire_at.toISOString()
    };

    await queueEmail(emailTemplate, {
        name: user.name,
        address: user.email
    });
}

export async function sendEmailConfirmUpdate(user: Partial<UserEntity> & {
    id: number,
    name: string,
    email: string,
    language: string
}): Promise<void> {
    const {token, expire_at} = createConfirmationToken(user);

    const emailTemplate: EmailTemplate = await loadEmailTemplate('email-confirm-update', user.language);

    emailTemplate.content.vars = {
        name: user.name,
        token: token,
        expire_at: expire_at.toISOString()
    };

    await queueEmail(emailTemplate, {
        name: user.name,
        address: user.email
    });
}

export async function sendWelcomeEmail(user: Partial<UserEntity> & {
    name: string,
    email: string,
    language: string
}): Promise<void> {
    const emailTemplate: EmailTemplate = await loadEmailTemplate('email-welcome', user.language);

    emailTemplate.content.vars = {
        name: user.name
    };

    await queueEmail(emailTemplate, {
        name: user.name,
        address: user.email
    });
}
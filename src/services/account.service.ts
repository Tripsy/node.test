import bcrypt from 'bcrypt';
import UserEntity from '../entities/user.entity';
import jwt from 'jsonwebtoken';
import {settings} from '../config/settings.config';
import {v4 as uuid} from 'uuid';
import {createFutureDate} from '../helpers/utils';
import AccountTokenEntity from '../entities/account-token.entity';
import AccountTokenRepository from '../repositories/account-token.repository';
import {Request} from 'express';
import {getClientIp} from '../helpers/system';
import {AuthTokenPayload, ConfirmationTokenPayload, AuthValidToken} from '../types/token.type';
import {getMetadataValue} from '../helpers/metadata';
import AccountRecoveryEntity from '../entities/account-recovery.entity';
import AccountRecoveryRepository from '../repositories/account-recovery.repository';
import {loadEmailTemplate, queueEmail} from '../providers/email.provider';
import {emailConfirmLink} from '../helpers/link';
import {EmailTemplate} from '../types/template.type';

export async function encryptPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

export function createAuthToken(user: UserEntity & { id: number; }): {
    token: string,
    ident: string,
    expire_at: Date
} {
    if (!user.id) {
        throw new Error('User object must contain `id` property.');
    }

    const ident: string = uuid();
    const expire_at: Date = createFutureDate(settings.user.authExpiresIn);

    const payload: AuthTokenPayload = {
        user_id: user.id,
        ident: ident
    };

    const token = jwt.sign(payload, settings.user.authSecret);

    return {token, ident, expire_at};
}

export type TokenMetadata = {
    'user-agent': string;
    'accept-language': string;
    'ip': string;
    'os': string;
};

export function buildMetadata(req: Request): TokenMetadata {
    return {
        'user-agent': req.headers['user-agent'] || '',
        'accept-language': req.headers['accept-language'] || '',
        'ip': getClientIp(req) || '',
        'os': req.body.os || ''
    }
}

export async function setupToken(user: UserEntity & { id: number; }, req: Request): Promise<string> {
    const {token, ident, expire_at} = createAuthToken(user);

    const accountTokenEntity = new AccountTokenEntity();
    accountTokenEntity.user_id = user.id;
    accountTokenEntity.ident = ident;
    accountTokenEntity.metadata = buildMetadata(req);
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
            label: getMetadataValue(token.metadata, 'user-agent'),
            used_at: token.used_at
        };
    });
}

export function readToken(req: Request): string | undefined {
    return req.headers.authorization?.split(' ')[1];
}

export async function setupRecovery(user: UserEntity & { id: number; }, req: Request): Promise<[string, Date]> {
    const ident: string = uuid();
    const expire_at = createFutureDate(settings.user.recoveryIdentExpiresIn);

    const accountRecoveryEntity = new AccountRecoveryEntity();
    accountRecoveryEntity.user_id = user.id;
    accountRecoveryEntity.ident = uuid();
    accountRecoveryEntity.metadata = buildMetadata(req);
    accountRecoveryEntity.expire_at = expire_at;

    await AccountRecoveryRepository.save(accountRecoveryEntity);

    return [ident, expire_at];
}

export function createConfirmationToken(user: UserEntity & { id: number; email: string }): {
    token: string,
    expire_at: Date
} {
    if (!user.id || !user.email) {
        throw new Error('User object must contain both `id` and `email` properties.');
    }

    const payload: ConfirmationTokenPayload = {
        user_id: user.id,
        user_email: user.email
    };

    const token = jwt.sign(payload, settings.user.emailConfirmationSecret, {
        expiresIn: `${settings.user.emailConfirmationExpiresIn}d`
    });

    const expire_at = createFutureDate(settings.user.emailConfirmationExpiresIn * 86400);

    return {token, expire_at};
}

export async function sendConfirmEmail(user: UserEntity): Promise<void> {
    const {token, expire_at} = createConfirmationToken(user);

    const emailTemplate: EmailTemplate = await loadEmailTemplate('email-confirm', user.language);

    void queueEmail(
        emailTemplate,
        {
            'name': user.name,
            'link': emailConfirmLink(token),
            'expire_at': expire_at.toISOString()
        },
        {
            name: user.name,
            address: user.email
        }
    );
}

export async function sendWelcomeEmail(user: UserEntity): Promise<void> {

    const emailTemplate: EmailTemplate = await loadEmailTemplate('email-welcome', user.language);

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
}
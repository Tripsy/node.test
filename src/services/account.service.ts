import bcrypt from 'bcrypt';
import UserEntity from '../entities/user.entity';
import jwt from 'jsonwebtoken';
import {settings} from '../config/settings.config';
import {v4 as uuid} from 'uuid';
import {createExpireDate} from '../helpers/utils';
import AccountTokenEntity from '../entities/account_token.entity';
import AccountTokenRepository from '../repositories/account-token.repository';
import {Request} from 'express';
import {getClientIp} from '../helpers/system';

export async function encryptPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

type UserWithRequiredTokenProperties = UserEntity & {
    id: number;
};

export function createAuthToken(user: UserWithRequiredTokenProperties): {
    token: string,
    ident: string,
    expire_at: Date
} {
    if (!user.id || !user.created_at) {
        throw new Error('User object must contain `id` property.');
    }

    const ident: string = uuid();
    const expire_at: Date = createExpireDate(settings.user.jwt_expires_in);

    const payload = {
        id: user.id,
        ident: ident
    };

    const token = jwt.sign(payload, settings.user.jwt_secret);

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

export async function setupToken(user: UserWithRequiredTokenProperties, req: Request): Promise<string> {
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

export async function getActiveSessions(user_id: number): Promise<{ id: number, label: string, used_at: Date }[]> {
    const activeSessions = await AccountTokenRepository.createQuery()
        .select(['id, metadata, used_at'])
        .filterBy('user_id', user_id)
        .filterByRange('expire_at', new Date())
        .all();

    return activeSessions.map(session => {
        return {
            id: session.id,
            label: session.metadata && session.metadata['user-agent'] ? session.metadata['user-agent'] : '',
            used_at: session.used_at
        };
    });
}
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
import {TokenPayload} from '../types/token-payload.type';
import {getMetadataValue} from '../helpers/metadata';
import {ValidToken} from '../types/valid-token.type';

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
    if (!user.id) {
        throw new Error('User object must contain `id` property.');
    }

    const ident: string = uuid();
    const expire_at: Date = createExpireDate(settings.user.jwt_expires_in);

    const payload: TokenPayload = {
        user_id: user.id,
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

export async function getValidTokens(user_id: number): Promise<ValidToken[]> {
    const validTokens = await AccountTokenRepository.createQuery()
        .select(['id', 'ident', 'metadata', 'used_at'])
        .filterBy('user_id', user_id)
        .filterByRange('expire_at', new Date())
        .all();

    return validTokens.map(token => {
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
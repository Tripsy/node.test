import bcrypt from 'bcrypt';
import UserEntity from '../entities/user.entity';
import jwt from 'jsonwebtoken';
import {settings} from '../config/settings.config';
import {v4 as uuid} from 'uuid';
import {createExpireDate} from '../helpers/utils';
import AccountTokenEntity from '../entities/account_token.entity';
import AccountTokenRepository from '../repositories/account-token.repository';

export async function encryptPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

interface RequiredTokenProperties {
    id: number;
}

type UserWithRequiredTokenProperties = UserEntity & RequiredTokenProperties;

export function createAuthToken(user: UserWithRequiredTokenProperties): { token: string, ident: string, expire_at: Date } {
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

export async function setupToken(user: UserWithRequiredTokenProperties): Promise<string> {
    const {token, ident, expire_at} = createAuthToken(user);

    const accountTokenEntity = new AccountTokenEntity();
    accountTokenEntity.user_id = user.id;
    accountTokenEntity.ident = ident;
    accountTokenEntity.expire_at = expire_at;

    await AccountTokenRepository.save(accountTokenEntity);

    return token;
}
import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {buildMetadata, readToken} from '../services/account.service';
import {settings} from '../config/settings.config';
import {TokenPayload} from '../types/token-payload.type';
import AccountTokenRepository from '../repositories/account-token.repository';
import {compareMetadataValue} from '../helpers/metadata';
import UserRepository from '../repositories/user.repository';
import {UserStatusEnum} from '../enums/user-status.enum';
import {createExpireDate} from '../helpers/utils';

async function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
    const token: string | undefined = readToken(req);

    if (!token) {
        return next();
    }

    // Verify JWT and extract payload
    let payload: TokenPayload;

    try {
        payload = jwt.verify(token, settings.user.jwt_secret) as TokenPayload;
    } catch (err) {
        return next();
    }

    const activeToken = await AccountTokenRepository.createQuery()
        .select(['id', 'metadata', 'expire_at'])
        .filterByIdent(payload.ident)
        .filterBy('user_id', payload.user_id)
        .first();

    if (!activeToken) {
        return next();
    }

    // Check if token is expired
    if (activeToken.expire_at < new Date()) {
        AccountTokenRepository.removeTokenById(activeToken.id);

        return next();
    }

    // Validate metadata (e.g., user-agent check)
    if (!compareMetadataValue(activeToken.metadata, buildMetadata(req), 'user-agent')) {
       return next();
    }

    const user = await UserRepository.createQuery()
        .select(['id', 'email', 'name', 'status'])
        .filterById(payload.user_id)
        .first();

    // User not found or inactive
    if (!user || user.status !== UserStatusEnum.ACTIVE) {
        return next();
    }

    // Refresh the token if it's close to expiration
    const diffInMinutes = Math.floor((activeToken.expire_at.getTime() - Date.now()) / 60000);

    if (diffInMinutes < settings.user.jwt_refresh_expires_in) {
        await AccountTokenRepository.update(activeToken.id, {
            used_at: new Date(),
            expire_at: createExpireDate(settings.user.jwt_expires_in),
        });
    } else {
        await AccountTokenRepository.update(activeToken.id, {
            used_at: new Date(),
        });
    }

    // Attach user information to the request object
    req.session = {
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        }
    };

    next();
}

export default sessionMiddleware;
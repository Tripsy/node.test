import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {readToken} from '../services/account.service';
import {settings} from '../config/settings.config';
import {AuthTokenPayload} from '../types/token.type';
import AccountTokenRepository from '../repositories/account-token.repository';
import {compareMetaDataValue, tokenMetaData} from '../helpers/meta-data.helper';
import UserRepository from '../repositories/user.repository';
import {UserStatusEnum} from '../enums/user-status.enum';
import {createFutureDate, dateDiffInSeconds} from '../helpers/utils.helper';

async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
    // Initialize the user as a visitor
    req.user = {
        id: 0,
        email: '',
        name: '',
        language: settings.app.defaultLanguage,
        role: 'visitor',
        permissions: [],
    };

    // Read the token from the request
    const token: string | undefined = readToken(req);

    if (!token) {
        return next();
    }

    // Verify JWT and extract payload
    let payload: AuthTokenPayload;

    try {
        payload = jwt.verify(token, settings.user.authSecret) as AuthTokenPayload;
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
    if (!compareMetaDataValue(activeToken.metadata, tokenMetaData(req), 'user-agent')) {
       return next();
    }

    const user = await UserRepository.createQuery()
        .select(['id', 'name', 'email', 'language', 'role', 'status'])
        .filterById(payload.user_id)
        .first();

    // User not found or inactive
    if (!user || user.status !== UserStatusEnum.ACTIVE) {
        AccountTokenRepository.removeTokenById(activeToken.id);

        return next();
    }

    // Refresh the token if it's close to expiration
    const diffInMinutes = dateDiffInSeconds(activeToken.expire_at.getTime(), new Date()) / 60;

    if (diffInMinutes < settings.user.authRefreshExpiresIn) {
        await AccountTokenRepository.update(activeToken.id, {
            used_at: new Date(),
            expire_at: createFutureDate(settings.user.authExpiresIn),
        });
    } else {
        await AccountTokenRepository.update(activeToken.id, {
            used_at: new Date(),
        });
    }

    // Attach user information to the request object
    req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language,
        permissions: [],
        role: user.role,
    };

    next();
}

export default authMiddleware;
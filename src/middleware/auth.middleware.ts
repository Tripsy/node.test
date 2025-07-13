import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {readToken} from '../services/account.service';
import {cfg} from '../config/settings.config';
import {AuthTokenPayload} from '../types/token.type';
import AccountTokenRepository from '../repositories/account-token.repository';
import {compareMetaDataValue, tokenMetaData} from '../helpers/meta-data.helper';
import UserRepository from '../repositories/user.repository';
import {UserStatusEnum} from '../enums/user-status.enum';
import {getPolicyPermissions} from '../services/user.service';
import {UserRoleEnum} from '../enums/user-role.enum';
import {createFutureDate, dateDiffInSeconds} from '../helpers/date.helper';

async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
    try {
        // Initialize the user as a visitor
        req.user = {
            id: 0,
            email: '',
            name: '',
            language: cfg('app.language'),
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
            payload = jwt.verify(token, cfg('user.authSecret')) as AuthTokenPayload;
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
        if (cfg('app.env') !== 'development' && !compareMetaDataValue(activeToken.metadata, tokenMetaData(req), 'user-agent')) {
            return next();
        }

        const user = await UserRepository.createQuery()
            .select(['id', 'name', 'email', 'language', 'role', 'status', 'created_at', 'updated_at'])
            .filterById(payload.user_id)
            .first();

        // User not found or inactive
        if (!user || user.status !== UserStatusEnum.ACTIVE) {
            AccountTokenRepository.removeTokenById(activeToken.id);

            return next();
        }

        // Refresh the token if it's close to expiration
        const diffInSeconds = dateDiffInSeconds(activeToken.expire_at, new Date());

        if (diffInSeconds < cfg('user.authRefreshExpiresIn')) {
            await AccountTokenRepository.update(activeToken.id, {
                used_at: new Date(),
                expire_at: createFutureDate(cfg('user.authExpiresIn')),
            });
        } else {
            await AccountTokenRepository.update(activeToken.id, {
                used_at: new Date(),
            });
        }

        // Attach user information to the request object
        req.user = {
            ...user,
            permissions: user.role === UserRoleEnum.OPERATOR ? await getPolicyPermissions(user.id) : [],
        };

        next();
    } catch (err) {
        next(err);
    }
}

export default authMiddleware;
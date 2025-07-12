import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import authMiddleware from '../../middleware/auth.middleware';
import {readToken} from '../../services/account.service';
import {cfg} from '../../config/settings.config';
import AccountTokenRepository from '../../repositories/account-token.repository';
import UserRepository from '../../repositories/user.repository';
import {UserStatusEnum} from '../../enums/user-status.enum';
import {compareMetaDataValue} from '../../helpers/meta-data.helper';
import {createFutureDate, dateDiffInSeconds} from '../../helpers/utils.helper';
import {UserRoleEnum} from '../../enums/user-role.enum';

jest.mock('../../services/account.service');
jest.mock('jsonwebtoken');
jest.mock('../../repositories/account-token.repository');
jest.mock('../../repositories/user.repository');
jest.mock('../../helpers/meta-data.helper');
jest.mock('../../helpers/utils.helper');

describe('authMiddleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            headers: {},
            user: {
                id: 0,
                email: '',
                name: '',
                language: '',
                role: UserRoleEnum.ADMIN,
                permissions: []
            }
        };
        res = {};
        next = jest.fn();
    });

    it('should call next() when no token is present', async () => {
        (readToken as jest.Mock).mockReturnValue(undefined);

        await authMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    });

    it('should call next() when JWT verification fails', async () => {
        (readToken as jest.Mock).mockReturnValue('invalid-token');

        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        await authMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    });

    it('should call next() when no active token is found', async () => {
        (readToken as jest.Mock).mockReturnValue('valid-token');

        (jwt.verify as jest.Mock).mockReturnValue({
            user_id: 1,
            ident: 'ident123'
        });

        jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            filterBy: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
        } as any);

        (AccountTokenRepository.createQuery().first as jest.Mock).mockResolvedValue(null);

        await authMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    });

    it('should remove expired token and call next()', async () => {
        const expiredToken = {
            id: 1,
            expire_at: new Date(Date.now() - 1000)
        };

        (readToken as jest.Mock).mockReturnValue('valid-token');

        (jwt.verify as jest.Mock).mockReturnValue({
            user_id: 1,
            ident: 'ident123'
        });

        jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            filterBy: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(expiredToken),
        } as any);

        (AccountTokenRepository.removeTokenById as jest.Mock).mockResolvedValue(undefined);

        await authMiddleware(req as Request, res as Response, next);

        expect(AccountTokenRepository.removeTokenById).toHaveBeenCalledWith(expiredToken.id);

        expect(next).toHaveBeenCalled();
    });

    it('should call next() if metadata validation fails', async () => {
        const validToken = {
            id: 1,
            metadata: {},
            expire_at: new Date(Date.now() + 1000000)
        };

        (readToken as jest.Mock).mockReturnValue('valid-token');

        (jwt.verify as jest.Mock).mockReturnValue({
            user_id: 1,
            ident: 'ident123'
        });

        jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            filterBy: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(validToken),
        } as any);

        (compareMetaDataValue as jest.Mock).mockReturnValue(false);

        await authMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    });

    it('should call next() if user is not found or inactive', async () => {
        const validToken = {
            id: 2,
            metadata: {},
            expire_at: new Date(Date.now() + 2000000)
        };

        const mockUser = {
            id: 1,
            status: UserStatusEnum.INACTIVE
        };

        (readToken as jest.Mock).mockReturnValue('valid-token-second');

        (jwt.verify as jest.Mock).mockReturnValue({
            user_id: 2,
            ident: 'ident1234'
        });

        jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            filterBy: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(validToken),
        } as any);

        (compareMetaDataValue as jest.Mock).mockReturnValue(true);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        await authMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    });

    it('should update token expiration when near expiry', async () => {
        const validToken = {
            id: 3,
            metadata: {},
            expire_at: new Date(Date.now() + 3000000)
        };

        const mockUser = {
            id: 2,
            status: UserStatusEnum.ACTIVE
        };

        (readToken as jest.Mock).mockReturnValue('valid-token');

        (jwt.verify as jest.Mock).mockReturnValue({
            user_id: 1,
            ident: 'ident123'
        });

        (AccountTokenRepository.createQuery().first as jest.Mock).mockResolvedValue(validToken);

        (compareMetaDataValue as jest.Mock).mockReturnValue(true);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        (dateDiffInSeconds as jest.Mock).mockReturnValue(cfg('user.authRefreshExpiresIn') - 1);

        (createFutureDate as jest.Mock).mockReturnValue(new Date(Date.now() + 3600000));

        await authMiddleware(req as Request, res as Response, next);

        expect(AccountTokenRepository.update).toHaveBeenCalledWith(validToken.id, expect.objectContaining({
            expire_at: expect.any(Date)
        }));
    });
});

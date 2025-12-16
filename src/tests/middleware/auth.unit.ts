import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { cfg } from '@/config/settings.config';
import { readToken } from '@/features/account/account.service';
import AccountTokenRepository from '@/features/account/account-token.repository';
import { UserRoleEnum, UserStatusEnum } from '@/features/user/user.entity';
import UserRepository from '@/features/user/user.repository';
import {
	compareMetaDataValue,
	createFutureDate,
	dateDiffInSeconds,
} from '@/helpers';
import authMiddleware from '@/middleware/auth.middleware';
import type { OutputWrapper } from '@/middleware/output-handler.middleware';
import { createAuthContext } from '@/tests/jest-functional.setup';

jest.mock('@/features/account/account.service');
jest.mock('jsonwebtoken');
jest.mock('@/features/account/account-token.repository');
jest.mock('@/features/user/user.repository');
jest.mock('@/helpers/meta-data.helper');
jest.mock('@/helpers/utils.helper');

describe('authMiddleware', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: NextFunction;

	beforeEach(() => {
		req = {
			headers: {},
		};
		res = {
			locals: {
				request_id: '',
				output: {} as unknown as OutputWrapper,
				lang: 'en',
				auth: createAuthContext({
					role: UserRoleEnum.ADMIN,
				}),
			},
		};
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
			ident: 'ident123',
		});

		const mockQueryBuilderAccountToken = {
			select: jest.fn().mockReturnThis(),
			filterByIdent: jest.fn().mockReturnThis(),
			filterBy: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(null),
		} as jest.MockedObject<
			ReturnType<typeof AccountTokenRepository.createQuery>
		>;

		jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue(
			mockQueryBuilderAccountToken,
		);

		(
			AccountTokenRepository.createQuery().first as jest.Mock
		).mockResolvedValue(null);

		await authMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalled();
	});

	it('should remove expired token and call next()', async () => {
		const expiredToken = {
			id: 1,
			expire_at: new Date(Date.now() - 1000),
		};

		(readToken as jest.Mock).mockReturnValue('valid-token');

		(jwt.verify as jest.Mock).mockReturnValue({
			user_id: 1,
			ident: 'ident123',
		});

		const mockQueryBuilderAccountToken = {
			select: jest.fn().mockReturnThis(),
			filterByIdent: jest.fn().mockReturnThis(),
			filterBy: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(expiredToken),
		} as jest.MockedObject<
			ReturnType<typeof AccountTokenRepository.createQuery>
		>;

		jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue(
			mockQueryBuilderAccountToken,
		);

		(AccountTokenRepository.removeTokenById as jest.Mock).mockResolvedValue(
			undefined,
		);

		await authMiddleware(req as Request, res as Response, next);

		expect(AccountTokenRepository.removeTokenById).toHaveBeenCalledWith(
			expiredToken.id,
		);

		expect(next).toHaveBeenCalled();
	});

	it('should call next() if metadata validation fails', async () => {
		const validToken = {
			id: 1,
			metadata: {},
			expire_at: new Date(Date.now() + 1000000),
		};

		(readToken as jest.Mock).mockReturnValue('valid-token');

		(jwt.verify as jest.Mock).mockReturnValue({
			user_id: 1,
			ident: 'ident123',
		});

		const mockQueryBuilderAccountToken = {
			select: jest.fn().mockReturnThis(),
			filterByIdent: jest.fn().mockReturnThis(),
			filterBy: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(validToken),
		} as jest.MockedObject<
			ReturnType<typeof AccountTokenRepository.createQuery>
		>;

		jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue(
			mockQueryBuilderAccountToken,
		);

		(compareMetaDataValue as jest.Mock).mockReturnValue(false);

		await authMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalled();
	});

	it('should call next() if user is not found or inactive', async () => {
		const validToken = {
			id: 2,
			metadata: {},
			expire_at: new Date(Date.now() + 2000000),
		};

		const mockUser = {
			id: 1,
			status: UserStatusEnum.INACTIVE,
		};

		(readToken as jest.Mock).mockReturnValue('valid-token-second');

		(jwt.verify as jest.Mock).mockReturnValue({
			user_id: 2,
			ident: 'ident1234',
		});

		const mockQueryBuilderAccountToken = {
			select: jest.fn().mockReturnThis(),
			filterByIdent: jest.fn().mockReturnThis(),
			filterBy: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(validToken),
		} as jest.MockedObject<
			ReturnType<typeof AccountTokenRepository.createQuery>
		>;

		jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue(
			mockQueryBuilderAccountToken,
		);

		(compareMetaDataValue as jest.Mock).mockReturnValue(true);

		const mockQueryBuilderUser = {
			select: jest.fn().mockReturnThis(),
			filterById: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(mockUser),
		} as jest.MockedObject<ReturnType<typeof UserRepository.createQuery>>;

		jest.spyOn(UserRepository, 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		await authMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalled();
	});

	it('should update token expiration when near expiry', async () => {
		const validToken = {
			id: 3,
			metadata: {},
			expire_at: new Date(Date.now() + 3000000),
		};

		const mockUser = {
			id: 2,
			status: UserStatusEnum.ACTIVE,
		};

		(readToken as jest.Mock).mockReturnValue('valid-token');

		(jwt.verify as jest.Mock).mockReturnValue({
			user_id: 1,
			ident: 'ident123',
		});

		(
			AccountTokenRepository.createQuery().first as jest.Mock
		).mockResolvedValue(validToken);

		(compareMetaDataValue as jest.Mock).mockReturnValue(true);

		const mockQueryBuilderUser = {
			select: jest.fn().mockReturnThis(),
			filterById: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(mockUser),
		} as jest.MockedObject<ReturnType<typeof UserRepository.createQuery>>;

		jest.spyOn(UserRepository, 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		(dateDiffInSeconds as jest.Mock).mockReturnValue(
			(cfg('user.authRefreshExpiresIn') as number) - 1,
		);

		(createFutureDate as jest.Mock).mockReturnValue(
			new Date(Date.now() + 3600000),
		);

		await authMiddleware(req as Request, res as Response, next);

		expect(AccountTokenRepository.update).toHaveBeenCalledWith(
			validToken.id,
			expect.objectContaining({
				expire_at: expect.any(Date),
			}),
		);
	});
});

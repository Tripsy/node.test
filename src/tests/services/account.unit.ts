import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createRequest } from 'node-mocks-http';
import { redisClose } from '@/config/init-redis.config';
import * as accountService from '@/features/account/account.service';
import AccountRecoveryRepository from '@/features/account/account-recovery.repository';
import AccountTokenRepository from '@/features/account/account-token.repository';
import type { TokenMetadata } from '@/helpers';
import { loadEmailTemplate, queueEmail } from '@/providers/email.provider';
import type { EmailTemplate } from '@/types/template.type';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('@/features/account/account-token.repository');
jest.mock('@/features/account/account-recovery.repository');
jest.mock('@/providers/email.provider');

const mockUser = {
	id: 1,
	email: 'test@example.com',
	name: 'Test User',
	password: 'hashedPassword',
	language: 'en',
};

afterAll(async () => {
	await redisClose();
});

describe('Account Service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('encryptPassword', () => {
		it('should hash password correctly', async () => {
			(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
			const result =
				await accountService.encryptPassword('plainPassword');

			expect(result).toBe('hashedPassword');
			expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
		});
	});

	describe('verifyPassword', () => {
		it('should return true for valid password', async () => {
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			const result = await accountService.verifyPassword(
				'plainPassword',
				'hashedPassword',
			);

			expect(result).toBe(true);
		});
	});

	describe('createAuthToken', () => {
		it('should generate a JWT token', async () => {
			(jwt.sign as jest.Mock).mockReturnValue('fakeToken');

			const result = accountService.createAuthToken(mockUser);

			expect(result).toHaveProperty('token', 'fakeToken');
			expect(result).toHaveProperty('ident');
			expect(result).toHaveProperty('expire_at');
		});
	});

	describe('setupToken', () => {
		it('should store the token in the repository', async () => {
			(jwt.sign as jest.Mock).mockReturnValue('fakeToken');
			(AccountTokenRepository.save as jest.Mock).mockResolvedValue(null);

			const mockRequest = createRequest({
				headers: {
					'user-agent': 'Mozilla/5.0',
					'accept-language': 'en-US,en;q=0.9',
				},
			});

			const token = await accountService.setupToken(
				mockUser,
				mockRequest,
			);

			expect(token).toBe('fakeToken');
			expect(AccountTokenRepository.save).toHaveBeenCalled();
		});
	});

	describe('readToken', () => {
		it('should read the token from the request headers', () => {
			const token = 'jwt-token-123';

			const mockRequest = createRequest({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			expect(accountService.readToken(mockRequest)).toBe(token);
		});

		it('should return undefined if no authorization header is present', () => {
			const mockRequest = createRequest({
				headers: {},
			});

			expect(accountService.readToken(mockRequest)).toBeUndefined();
		});
	});

	describe('setupRecovery', () => {
		it('should store recovery info', async () => {
			(AccountRecoveryRepository.save as jest.Mock).mockResolvedValue(
				null,
			);

			const metadata: TokenMetadata = {
				'user-agent': 'Mozilla',
				'accept-language': 'en-US,en;q=0.9',
				ip: '127.0.0.1',
				os: 'Windows',
			};

			const [ident, expire_at] = await accountService.setupRecovery(
				mockUser,
				metadata,
			);

			expect(ident).toBeDefined();
			expect(expire_at).toBeInstanceOf(Date);
			expect(AccountRecoveryRepository.save).toHaveBeenCalled();
		});
	});

	describe('createConfirmationToken', () => {
		it('should return token and expiry', async () => {
			(jwt.sign as jest.Mock).mockReturnValue('fakeToken');

			const result = accountService.createConfirmationToken(mockUser);

			expect(result.token).toBe('fakeToken');
			expect(result.expire_at).toBeInstanceOf(Date);
		});
	});

	describe('sendEmailConfirmCreate', () => {
		it('should send an email confirmation for account creation', async () => {
			const token = 'jwt-token-123';
			const emailTemplate: EmailTemplate = {
				language: mockUser.language,
				content: {
					subject: 'Confirm Email',
					html: 'Confirm your email',
				},
			};

			(jwt.sign as jest.Mock).mockReturnValue(token);
			(loadEmailTemplate as jest.Mock).mockResolvedValue(emailTemplate);

			await accountService.sendEmailConfirmCreate(mockUser);

			expect(loadEmailTemplate).toHaveBeenCalledWith(
				'email-confirm-create',
				mockUser.language,
			);

			expect(queueEmail).toHaveBeenCalledWith(emailTemplate, {
				name: mockUser.name,
				address: mockUser.email,
			});
		});
	});

	describe('sendEmailConfirmUpdate', () => {
		it('should send an email confirmation for email update', async () => {
			const token = 'jwt-token-123';
			const email_new = 'some-new-email@sample.com';
			const emailTemplate: EmailTemplate = {
				language: mockUser.language,
				content: {
					subject: 'Confirm Email Update',
					html: 'Confirm your email update',
				},
			};

			(jwt.sign as jest.Mock).mockReturnValue(token);
			(loadEmailTemplate as jest.Mock).mockResolvedValue(emailTemplate);

			await accountService.sendEmailConfirmUpdate(mockUser, email_new);

			expect(loadEmailTemplate).toHaveBeenCalledWith(
				'email-confirm-update',
				mockUser.language,
			);

			expect(queueEmail).toHaveBeenCalledWith(emailTemplate, {
				name: mockUser.name,
				address: email_new,
			});
		});
	});

	describe('sendWelcomeEmail', () => {
		it('should send a welcome email', async () => {
			const emailTemplate: EmailTemplate = {
				language: mockUser.language,
				content: {
					subject: 'Welcome',
					html: 'Welcome to our service',
				},
			};

			(loadEmailTemplate as jest.Mock).mockResolvedValue(emailTemplate);

			await accountService.sendWelcomeEmail(mockUser);

			expect(loadEmailTemplate).toHaveBeenCalledWith(
				'email-welcome',
				mockUser.language,
			);

			expect(queueEmail).toHaveBeenCalledWith(emailTemplate, {
				name: mockUser.name,
				address: mockUser.email,
			});
		});
	});
});

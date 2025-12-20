import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
import { redisClose } from '@/config/init-redis.config';
import {
	// createAuthToken,
	encryptPassword,
	verifyPassword,
} from '@/features/account/account.service';

// Mock uuid before imports
jest.mock('uuid', () => ({
	v4: () => 'uuid-123',
}));

// Mock settings.config
jest.mock('@/config/settings.config', () => ({
	cfg: jest.fn((key: string) => {
		if (key === 'user.authExpiresIn') return 3600;
		if (key === 'user.authSecret') return 'secret-key';
		return null;
	}),
}));

// Mock date helper
jest.mock('@/lib/helpers/date.helper', () => ({
	createFutureDate: () => new Date('2030-01-01'),
}));

// Mock uuid
jest.mock('uuid', () => ({
	v4: () => 'uuid-123',
}));

// Mock your repositories
jest.mock('@/features/account/account-token.repository');
jest.mock('@/features/account/account-recovery.repository');
jest.mock('@/lib/providers/email.provider');

afterAll(async () => {
	await redisClose();
});

describe('Account Service', () => {
	describe('encryptPassword', () => {
		it('returns a hashed password', async () => {
			const password = 'super-secret';

			const hash = await encryptPassword(password);

			expect(hash).toBeDefined();
			expect(typeof hash).toBe('string');
			expect(hash).not.toBe(password);
		});

		it('produces a hash that matches the original password', async () => {
			const password = 'super-secret';

			const hash = await encryptPassword(password);
			const isValid = await bcrypt.compare(password, hash);

			expect(isValid).toBe(true);
		});

		it('produces different hashes for the same password (salted)', async () => {
			const password = 'super-secret';

			const hash1 = await encryptPassword(password);
			const hash2 = await encryptPassword(password);

			expect(hash1).not.toBe(hash2);
		});
	});

	describe('verifyPassword', () => {
		it('returns true for a matching password', async () => {
			const password = 'super-secret';
			const hash = await encryptPassword(password);

			const result = await verifyPassword(password, hash);

			expect(result).toBe(true);
		});

		it('returns false for a non-matching password', async () => {
			const password = 'super-secret';
			const wrongPassword = 'not-the-same';
			const hash = await encryptPassword(password);

			const result = await verifyPassword(wrongPassword, hash);

			expect(result).toBe(false);
		});

		it('returns false when hash does not belong to password', async () => {
			const password1 = 'password-one';
			const password2 = 'password-two';

			const hash = await encryptPassword(password1);
			const result = await verifyPassword(password2, hash);

			expect(result).toBe(false);
		});

		it('returns false if hashedPassword is invalid', async () => {
			const result = await verifyPassword('password', 'not-a-valid-hash');

			expect(result).toBe(false);
		});
	});

	// describe('createAuthToken', () => {
	// 	const mockUser = { id: 123 };
	//
	// 	beforeEach(() => {
	// 		jest.clearAllMocks();
	//
	// 		jest.spyOn(jwt, 'sign').mockReturnValue('jwt-token' as any);
	// 	});
	//
	// 	it('throws if user.id is missing', () => {
	// 		expect(() => createAuthToken({} as any)).toThrow(
	// 			'User object must contain `id` property.',
	// 		);
	// 	});
	//
	// 	it('returns token, ident, and expire_at', () => {
	// 		const result = createAuthToken(mockUser);
	//
	// 		expect(result).toEqual({
	// 			token: 'jwt-token',
	// 			ident: 'uuid-123',
	// 			expire_at: new Date('2030-01-01'),
	// 		});
	// 	});
	//
	// 	it('signs jwt with correct payload and secret', () => {
	// 		createAuthToken(mockUser);
	//
	// 		expect(jwt.sign).toHaveBeenCalledWith(
	// 			{
	// 				user_id: 123,
	// 				ident: 'uuid-123',
	// 			},
	// 			'secret-key',
	// 		);
	// 	});
	// });
	//
	// describe('setupToken', () => {
	//     it('should store the token in the repository', async () => {
	//         (jwt.sign as jest.MockedFunction<typeof jwt.sign>).mockReturnValue('fakeToken');
	//         (AccountTokenRepository.save as jest.MockedFunction<typeof AccountTokenRepository.save>).mockResolvedValue(undefined);
	//
	//         const mockRequest = createRequest({
	//             headers: {
	//                 'user-agent': 'Mozilla/5.0',
	//                 'accept-language': 'en-US,en;q=0.9',
	//             },
	//         });
	//
	//         const token = await accountService.setupToken(
	//             mockUser,
	//             mockRequest,
	//         );
	//
	//         expect(token).toBe('fakeToken');
	//         expect(AccountTokenRepository.save).toHaveBeenCalled();
	//     });
	// });
	//
	// describe('readToken', () => {
	//     it('should read the token from the request headers', () => {
	//         const token = 'jwt-token-123';
	//
	//         const mockRequest = createRequest({
	//             headers: {
	//                 authorization: `Bearer ${token}`,
	//             },
	//         });
	//
	//         expect(accountService.readToken(mockRequest)).toBe(token);
	//     });
	//
	//     it('should return undefined if no authorization header is present', () => {
	//         const mockRequest = createRequest({
	//             headers: {},
	//         });
	//
	//         expect(accountService.readToken(mockRequest)).toBeUndefined();
	//     });
	// });
	//
	// describe('setupRecovery', () => {
	//     it('should store recovery info', async () => {
	//         (AccountRecoveryRepository.save as jest.MockedFunction<typeof AccountRecoveryRepository.save>).mockResolvedValue(
	//             undefined,
	//         );
	//
	//         const metadata: TokenMetadata = {
	//             'user-agent': 'Mozilla',
	//             'accept-language': 'en-US,en;q=0.9',
	//             ip: '127.0.0.1',
	//             os: 'Windows',
	//         };
	//
	//         const [ident, expire_at] = await accountService.setupRecovery(
	//             mockUser,
	//             metadata,
	//         );
	//
	//         expect(ident).toBeDefined();
	//         expect(expire_at).toBeInstanceOf(Date);
	//         expect(AccountRecoveryRepository.save).toHaveBeenCalled();
	//     });
	// });
	//
	// describe('createConfirmationToken', () => {
	//     it('should return token and expiry', async () => {
	//         (jwt.sign as jest.MockedFunction<typeof jwt.sign>).mockReturnValue('fakeToken');
	//
	//         const result = accountService.createConfirmationToken(mockUser);
	//
	//         expect(result.token).toBe('fakeToken');
	//         expect(result.expire_at).toBeInstanceOf(Date);
	//     });
	// });
	//
	// describe('sendEmailConfirmCreate', () => {
	//     it('should send an email confirmation for account creation', async () => {
	//         const token = 'jwt-token-123';
	//         const emailTemplate: EmailTemplate = {
	//             language: mockUser.language,
	//             content: {
	//                 subject: 'Confirm Email',
	//                 html: 'Confirm your email',
	//             },
	//         };
	//
	//         (jwt.sign as jest.MockedFunction<typeof jwt.sign>).mockReturnValue(token);
	//         (loadEmailTemplate as jest.MockedFunction<typeof loadEmailTemplate>).mockResolvedValue(emailTemplate);
	//
	//         await accountService.sendEmailConfirmCreate(mockUser);
	//
	//         expect(loadEmailTemplate).toHaveBeenCalledWith(
	//             'email-confirm-create',
	//             mockUser.language,
	//         );
	//
	//         expect(queueEmail as jest.MockedFunction<typeof queueEmail>).toHaveBeenCalledWith(emailTemplate, {
	//             name: mockUser.name,
	//             address: mockUser.email,
	//         });
	//     });
	// });
	//
	// describe('sendEmailConfirmUpdate', () => {
	//     it('should send an email confirmation for email update', async () => {
	//         const token = 'jwt-token-123';
	//         const email_new = 'some-new-email@sample.com';
	//         const emailTemplate: EmailTemplate = {
	//             language: mockUser.language,
	//             content: {
	//                 subject: 'Confirm Email Update',
	//                 html: 'Confirm your email update',
	//             },
	//         };
	//
	//         (jwt.sign as jest.MockedFunction<typeof jwt.sign>).mockReturnValue(token);
	//         (loadEmailTemplate as jest.MockedFunction<typeof loadEmailTemplate>).mockResolvedValue(emailTemplate);
	//
	//         await accountService.sendEmailConfirmUpdate(mockUser, email_new);
	//
	//         expect(loadEmailTemplate).toHaveBeenCalledWith(
	//             'email-confirm-update',
	//             mockUser.language,
	//         );
	//
	//         expect(queueEmail as jest.MockedFunction<typeof queueEmail>).toHaveBeenCalledWith(emailTemplate, {
	//             name: mockUser.name,
	//             address: email_new,
	//         });
	//     });
	// });
	//
	// describe('sendWelcomeEmail', () => {
	//     it('should send a welcome email', async () => {
	//         const emailTemplate: EmailTemplate = {
	//             language: mockUser.language,
	//             content: {
	//                 subject: 'Welcome',
	//                 html: 'Welcome to our service',
	//             },
	//         };
	//
	//         (loadEmailTemplate as jest.MockedFunction<typeof loadEmailTemplate>).mockResolvedValue(emailTemplate);
	//
	//         await accountService.sendWelcomeEmail(mockUser);
	//
	//         expect(loadEmailTemplate).toHaveBeenCalledWith(
	//             'email-welcome',
	//             mockUser.language,
	//         );
	//
	//         expect(queueEmail as jest.MockedFunction<typeof queueEmail>).toHaveBeenCalledWith(emailTemplate, {
	//             name: mockUser.name,
	//             address: mockUser.email,
	//         });
	//     });
	// });
});

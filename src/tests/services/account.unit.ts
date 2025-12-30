// import { jest } from '@jest/globals';
// import { createRequest } from 'node-mocks-http';
// import { redisClose } from '@/config/init-redis.config';
//
// // Mock ALL external dependencies
// jest.mock('bcrypt', () => ({
// 	hash: jest.fn(() => Promise.resolve('hashedPassword')),
// 	compare: jest.fn(() => Promise.resolve(true)),
// }));
//
// jest.mock('jsonwebtoken', () => ({
// 	sign: jest.fn(() => 'mocked-jwt-token'),
// 	verify: jest.fn(),
// 	decode: jest.fn(),
// }));
//
// jest.mock('@/features/account/account-token.repository', () => ({
// 	__esModule: true,
// 	default: {
// 		save: jest.fn(() => Promise.resolve()),
// 	},
// }));
//
// jest.mock('@/features/account/account-recovery.repository', () => ({
// 	__esModule: true,
// 	default: {
// 		save: jest.fn(() => Promise.resolve()),
// 	},
// }));
//
// jest.mock('@/lib/providers/email.provider', () => ({
// 	loadEmailTemplate: jest.fn(() =>
// 		Promise.resolve({
// 			language: 'en',
// 			content: {
// 				subject: 'Test Subject',
// 				html: 'Test HTML',
// 			},
// 		}),
// 	),
// 	queueEmail: jest.fn(() => Promise.resolve()),
// }));
//
// import * as accountService from '@/features/account/account.service';
//
// const mockUser = {
// 	id: 1,
// 	email: 'test@example.com',
// 	name: 'Test User',
// 	password: 'hashedPassword',
// 	language: 'en',
// };
//
// afterAll(async () => {
// 	await redisClose();
// });
//
// describe('Account Service', () => {
// 	beforeEach(() => {
// 		jest.clearAllMocks();
// 	});
//
// 	// describe('createAuthToken', () => {
// 	// 	it('should return token with ident and expiry', () => {
// 	// 		// Act
// 	// 		const result = accountService.createAuthToken(mockUser);
// 	//
// 	// 		// Assert - test YOUR function's output structure
// 	// 		expect(result).toEqual({
// 	// 			token: 'mocked-jwt-token',
// 	// 			ident: expect.any(String), // Your function generates this
// 	// 			expire_at: expect.any(Date), // Your function sets this
// 	// 		});
// 	// 	});
// 	// });
// 	//
// 	// describe('setupToken', () => {
// 	// 	it('should create token and save to repository', async () => {
// 	// 		// Arrange
// 	// 		const mockRequest = createRequest({
// 	// 			ip: '127.0.0.1',
// 	// 			headers: {
// 	// 				'user-agent': 'Mozilla/5.0',
// 	// 				'accept-language': 'en-US,en;q=0.9',
// 	// 			},
// 	// 			get: (header: string) => {
// 	// 				if (header.toLowerCase() === 'user-agent')
// 	// 					return 'Mozilla/5.0';
// 	// 				return '';
// 	// 			},
// 	// 		});
// 	//
// 	// 		// Act
// 	// 		const result = await accountService.setupToken(
// 	// 			mockUser,
// 	// 			mockRequest as any,
// 	// 		);
// 	//
// 	// 		// Assert - test YOUR function's behavior
// 	// 		expect(result).toBe('mocked-jwt-token');
// 	// 		// The actual repository.save call is mocked, so it just succeeds
// 	// 	});
// 	//
// 	// 	it('should include proper metadata from request', async () => {
// 	// 		// This is where you test YOUR logic
// 	// 		const mockRequest = createRequest({
// 	// 			ip: '192.168.1.100',
// 	// 			headers: { 'user-agent': 'Custom Agent' },
// 	// 			get: (header: string) =>
// 	// 				header === 'user-agent' ? 'Custom Agent' : '',
// 	// 		});
// 	//
// 	// 		await accountService.setupToken(mockUser, mockRequest as any);
// 	//
// 	// 		// Here you'd assert that your metadata extraction works
// 	// 		// But since repository.save is mocked, you can't verify what was saved
// 	// 	});
// 	// });
//
// 	// ... other tests follow the same pattern
// });

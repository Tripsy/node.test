import {jest} from '@jest/globals';
import '../jest-controller.setup';
import request from 'supertest';
import app from '@/app';
import {accountPolicy} from '@/features/account/account.policy';
import accountRoutes from '@/features/account/account.routes';
import {accountService} from '@/features/account/account.service';
import UserEntity, {UserStatusEnum} from '@/features/user/user.entity';
import {addDebugResponse, entityDataMock, isAuthenticatedSpy, notAuthenticatedSpy,} from '@/tests/jest-controller.setup';
import {userService} from "@/features/user/user.service";
import {accountTokenService, type AuthValidToken} from "@/features/account/account-token.service";
import {mockUuid} from "@/tests/jest.setup";

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'AccountController';
const basePath = accountRoutes.basePath;
const mockUser = entityDataMock<UserEntity>('user');
const mockAuthValidToken = entityDataMock<AuthValidToken>('auth-valid-token');

// Mock configuration
jest.mock('@/config/settings.config', () => ({
    cfg: jest.fn((key: string) => {
        const configs: Record<string, any> = {
            'user.maxActiveSessions': 2,
            // 'user.recoveryAttemptsInLastSixHours': 3,
            // 'user.recoveryEnableMetadataCheck': true,
            // 'user.emailConfirmationSecret': 'test-secret',
        };
        
        return configs[key];
    }),
}));

// describe(`${controller} - register`, () => {
// 	const link = `${basePath}/register`;
//
// 	it('should fail if authenticated', async () => {
// 		isAuthenticatedSpy(accountPolicy);
//
// 		const response = await request(app).post(link).send();
//
// 		expect(response.status).toBe(403);
// 	});
//
// 	it('should return success', async () => {
//         notAuthenticatedSpy(accountPolicy);
//
// 		jest.spyOn(accountService, 'register').mockResolvedValue(mockUser);
//
// 		const response = await request(app).post(link).send({
// 			name: 'John Doe',
// 			email: 'john.doe@example.com',
// 			password: 'Secure@123',
// 			password_confirm: 'Secure@123',
// 			language: 'en',
// 		});
//
// 		try {
// 			expect(response.status).toBe(201);
// 			expect(response.body).toHaveProperty('success', true);
// 			expect(response.body.data).toHaveProperty('id', mockUser.id);
// 		} catch (error) {
// 			addDebugResponse(response, `${controller} - register`);
//
// 			throw error; // Re-throw to fail the test
// 		}
// 	});
// });
//
// describe(`${controller} - login`, () => {
//     const link = `${basePath}/login`;
//
//     it('should fail if authenticated', async () => {
//         isAuthenticatedSpy(accountPolicy);
//
//         const response = await request(app).post(link).send();
//
//         expect(response.status).toBe(403);
//     });
//
//     it('should return not authorized', async () => {
//         notAuthenticatedSpy(accountPolicy);
//
//         jest.spyOn(userService, 'findByEmail').mockResolvedValue({
//             ...mockUser,
//             status: UserStatusEnum.ACTIVE
//         });
//
//         const response = await request(app).post(link).send({
//             email: mockUser.email,
//             password: 'Secure@123',
//         });
//
//         try {
//             expect(response.status).toBe(401);
//             expect(response.body).toHaveProperty('success', false);
//         } catch (error) {
//             addDebugResponse(response, `${controller} - login`);
//
//             throw error; // Re-throw to fail the test
//         }
//     });
//
//     it('should return error due max active sessions', async () => {
//         notAuthenticatedSpy(accountPolicy);
//
//         jest.spyOn(userService, 'findByEmail').mockResolvedValue({
//             ...mockUser,
//             status: UserStatusEnum.ACTIVE
//         });
//
//         jest.spyOn(accountService, 'checkPassword').mockResolvedValue(true);
//         jest.spyOn(accountTokenService, 'getAuthValidTokens').mockResolvedValue([
//             mockAuthValidToken,
//             mockAuthValidToken,
//         ]);
//
//         const response = await request(app).post(link).send({
//             email: mockUser.email,
//             password: 'Secure@123',
//         });
//
//         try {
//             expect(response.status).toBe(403);
//             expect(response.body).toHaveProperty('success', false);
//             expect(response.body).toHaveProperty('message', 'account.error.max_active_sessions');
//         } catch (error) {
//             addDebugResponse(response, `${controller} - login`);
//
//             throw error; // Re-throw to fail the test
//         }
//     });
//
//     it('should return success', async () => {
//         notAuthenticatedSpy(accountPolicy);
//
//         jest.spyOn(userService, 'findByEmail').mockResolvedValue({
//             ...mockUser,
//             status: UserStatusEnum.ACTIVE
//         });
//
//         jest.spyOn(accountService, 'checkPassword').mockResolvedValue(true);
//         jest.spyOn(accountTokenService, 'getAuthValidTokens').mockResolvedValue([]);
//         jest.spyOn(accountTokenService, 'setupAuthToken').mockResolvedValue('some_token');
//
//         const response = await request(app).post(link).send({
//             email: mockUser.email,
//             password: 'Secure@123',
//         });
//
//         try {
//             expect(response.status).toBe(200);
//             expect(response.body).toHaveProperty('success', true);
//             expect(response.body).toHaveProperty('message', 'account.success.login');
//             expect(response.body.data).toHaveProperty('token');
//         } catch (error) {
//             addDebugResponse(response, `${controller} - login`);
//
//             throw error; // Re-throw to fail the test
//         }
//     });
// });

// describe(`${controller} - removeToken`, () => {
//     const link = `${basePath}/token`;
//
//     it('should return success', async () => {
//         notAuthenticatedSpy(accountPolicy);
//
//         jest.spyOn(accountTokenService, 'removeAccountTokenByIdent').mockResolvedValue(undefined);
//
//         const response = await request(app).delete(link).send({
//             ident: mockUuid(),
//         });
//
//         try {
//             expect(response.status).toBe(200);
//             expect(response.body).toHaveProperty('success', true);
//             expect(response.body).toHaveProperty('message', 'account.success.token_deleted');
//         } catch (error) {
//             addDebugResponse(response, `${controller} - removeToken`);
//
//             throw error; // Re-throw to fail the test
//         }
//     });
// });


// delete
describe(`${controller} - logout`, () => {
    const link = `${basePath}/logout`;

	it('should fail if not authenticated', async () => {
		isAuthenticatedSpy(accountPolicy);

		const response = await request(app).post(link).send();

		expect(response.status).toBe(403);
	});

	it('should return success', async () => {
        notAuthenticatedSpy(accountPolicy);

		jest.spyOn(accountService, 'register').mockResolvedValue(mockUser);

		const response = await request(app).post(link).send({
			name: 'John Doe',
			email: 'john.doe@example.com',
			password: 'Secure@123',
			password_confirm: 'Secure@123',
			language: 'en',
		});

		try {
			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveProperty('id', mockUser.id);
		} catch (error) {
			addDebugResponse(response, `${controller} - register`);

			throw error; // Re-throw to fail the test
		}
	});    
});
//
// // post
// describe(`${controller} - passwordRecover`, () => {
//     const link = `${basePath}/password-recover`;
// });
//
// // post
// describe(`${controller} - passwordRecoverChange`, () => {
//     const link = `${basePath}/password-recover-change/:ident`;
// });
//
// // post
// describe(`${controller} - passwordUpdate`, () => {
//     const link = `${basePath}/password-update`;
// });
//
// // post
// describe(`${controller} - emailConfirm`, () => {
//     const link = `${basePath}/email-confirm/:token`;
// });
//
// // post
// describe(`${controller} - emailConfirmSend`, () => {
//     const link = `${basePath}/email-confirm-send`;
// });
//
// // post
// describe(`${controller} - emailUpdate`, () => {
//     const link = `${basePath}/email-update`;
// });
//
// // get
// describe(`${controller} - meDetails`, () => {
//     const link = `${basePath}/me`;
// });
//
// // get
// describe(`${controller} - meSessions`, () => {
//     const link = `${basePath}/me/sessions`;
// });
//
// // post
// describe(`${controller} - meEdit`, () => {
//     const link = `${basePath}/me/edit`;
// });
//
// // delete
// describe(`${controller} - meDelete`, () => {
//     const link = `${basePath}/me/delete`;
// });

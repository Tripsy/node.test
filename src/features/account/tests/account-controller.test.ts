import { jest } from '@jest/globals';
import request from 'supertest';
import app from '@/app';
import { Configuration } from '@/config/settings.config';
import { accountPolicy } from '@/features/account/account.policy';
import accountRoutes from '@/features/account/account.routes';
import { accountService } from '@/features/account/account.service';
import type AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import { accountRecoveryService } from '@/features/account/account-recovery.service';
import { accountTokenService } from '@/features/account/account-token.service';
import {
	accountRecoveryMock,
	accountTokenMock,
	authValidTokenMock,
	confirmationTokenPayloadMock,
} from '@/features/account/tests/account.mock';
import { userEntityMock } from '@/features/user/tests/user.mock';
import { UserStatusEnum } from '@/features/user/user.entity';
import { userService } from '@/features/user/user.service';
import { addDebugResponse } from '@/tests/jest-controller.setup';
import {
	mockFutureDate,
	mockPastDate,
	mockUuid,
} from '@/tests/mocks/helpers.mock';
import {
	isAuthenticatedSpy,
	notAuthenticatedSpy,
} from '@/tests/mocks/policies.mock';
import { mockAccountEmailService } from '@/tests/mocks/services.mock';

const controller = 'AccountController';
const basePath = accountRoutes.basePath;
const mockUser = userEntityMock;

afterEach(() => {
	jest.restoreAllMocks();
});

describe(`${controller} - register`, () => {
	const link = `${basePath}/register`;

	it('should fail if authenticated', async () => {
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
			expect(response.body).toHaveProperty(
				'message',
				'account.success.register',
			);
			expect(response.body.data).toHaveProperty('id', mockUser.id);
		} catch (error) {
			addDebugResponse(response, `${controller} - register`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - login`, () => {
	const link = `${basePath}/login`;

	it('should fail if authenticated', async () => {
		isAuthenticatedSpy(accountPolicy);

		const response = await request(app).post(link).send();

		expect(response.status).toBe(403);
	});

	it('should return not authorized', async () => {
		notAuthenticatedSpy(accountPolicy);

		jest.spyOn(userService, 'findByEmail').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.ACTIVE,
		});

		const response = await request(app).post(link).send({
			email: mockUser.email,
			password: 'Secure@123',
		});

		try {
			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty('success', false);
		} catch (error) {
			addDebugResponse(response, `${controller} - login`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should return error due max active sessions', async () => {
		notAuthenticatedSpy(accountPolicy);

		const mockAuthValidToken = authValidTokenMock;

		jest.spyOn(userService, 'findByEmail').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.ACTIVE,
		});

		jest.spyOn(accountService, 'checkPassword').mockResolvedValue(true);
		jest.spyOn(accountTokenService, 'getAuthValidTokens').mockResolvedValue(
			[mockAuthValidToken, mockAuthValidToken],
		);

		const response = await request(app).post(link).send({
			email: mockUser.email,
			password: 'Secure@123',
		});

		try {
			expect(response.status).toBe(403);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty(
				'message',
				'account.error.max_active_sessions',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - login`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should return success', async () => {
		notAuthenticatedSpy(accountPolicy);

		jest.spyOn(userService, 'findByEmail').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.ACTIVE,
		});

		jest.spyOn(accountService, 'checkPassword').mockResolvedValue(true);
		jest.spyOn(accountTokenService, 'getAuthValidTokens').mockResolvedValue(
			[],
		);
		jest.spyOn(accountTokenService, 'setupAuthToken').mockResolvedValue(
			'some_token',
		);

		const response = await request(app).post(link).send({
			email: mockUser.email,
			password: 'Secure@123',
		});

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.login',
			);
			expect(response.body.data).toHaveProperty('token');
		} catch (error) {
			addDebugResponse(response, `${controller} - login`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - removeToken`, () => {
	const link = `${basePath}/token`;

	it('should return success', async () => {
		notAuthenticatedSpy(accountPolicy);

		jest.spyOn(
			accountTokenService,
			'removeAccountTokenByIdent',
		).mockResolvedValue(undefined);

		const response = await request(app).delete(link).send({
			ident: mockUuid(),
		});

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.token_deleted',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - removeToken`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - logout`, () => {
	const link = `${basePath}/logout`;

	it('should fail if not authenticated', async () => {
		notAuthenticatedSpy(accountPolicy);

		const response = await request(app).delete(link).send();

		expect(response.status).toBe(401);
	});

	it('should return success', async () => {
		isAuthenticatedSpy(accountPolicy);

		const mockAccountToken = accountTokenMock;

		jest.spyOn(
			accountTokenService,
			'getAuthTokenFromHeaders',
		).mockReturnValue('random_string');
		jest.spyOn(accountTokenService, 'findByToken').mockResolvedValue(
			mockAccountToken,
		);
		jest.spyOn(
			accountTokenService,
			'removeAccountTokenByIdent',
		).mockResolvedValue(undefined);

		const response = await request(app).delete(link).send();

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.logout',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - logout`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - passwordRecover`, () => {
	const link = `${basePath}/password-recover`;

	it('should fail if authenticated', async () => {
		isAuthenticatedSpy(accountPolicy);

		const response = await request(app).post(link).send();

		expect(response.status).toBe(403);
	});

	it('should return error due to recovery attempts exceeded', async () => {
		notAuthenticatedSpy(accountPolicy);

		jest.spyOn(userService, 'findByEmail').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.ACTIVE,
		});
		jest.spyOn(
			accountRecoveryService,
			'countRecoveryAttempts',
		).mockResolvedValue(5);

		const response = await request(app).post(link).send({
			email: 'john.doe@example.com',
		});

		try {
			expect(response.status).toBe(425);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty(
				'message',
				'account.error.recovery_attempts_exceeded',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - passwordRecover`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should return success', async () => {
		notAuthenticatedSpy(accountPolicy);

		jest.spyOn(userService, 'findByEmail').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.ACTIVE,
		});
		jest.spyOn(
			accountRecoveryService,
			'countRecoveryAttempts',
		).mockResolvedValue(0);
		jest.spyOn(accountRecoveryService, 'setupRecovery').mockResolvedValue([
			mockUuid(),
			mockFutureDate(28800),
		]);
		mockAccountEmailService();

		const response = await request(app).post(link).send({
			email: 'john.doe@example.com',
		});

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.password_recover',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - passwordRecover`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - passwordRecoverChange`, () => {
	const link = `${basePath}/password-recover-change/${mockUuid()}`;
	const mockAccountRecovery = accountRecoveryMock;

	it('should fail if authenticated', async () => {
		isAuthenticatedSpy(accountPolicy);

		const response = await request(app).post(link).send();

		expect(response.status).toBe(403);
	});

	it('should return error - account recovery token already used', async () => {
		notAuthenticatedSpy(accountPolicy);

		jest.spyOn(accountRecoveryService, 'findByIdent').mockResolvedValue(
			mockAccountRecovery,
		);

		const response = await request(app).post(link).send({
			password: 'Secure@123!',
			password_confirm: 'Secure@123!',
		});

		try {
			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty(
				'message',
				'account.error.recovery_token_used',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - passwordRecoverChange`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should return error - account recovery token expired', async () => {
		notAuthenticatedSpy(accountPolicy);

		jest.spyOn(accountRecoveryService, 'findByIdent').mockResolvedValue({
			...mockAccountRecovery,
			used_at: null,
			expire_at: mockPastDate(14400),
		});

		const response = await request(app).post(link).send({
			password: 'Secure@123!',
			password_confirm: 'Secure@123!',
		});

		try {
			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty(
				'message',
				'account.error.recovery_token_expired',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - passwordRecoverChange`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should return success', async () => {
		notAuthenticatedSpy(accountPolicy);

		Configuration.set('user.recoveryEnableMetadataCheck', false);

		jest.spyOn(accountRecoveryService, 'findByIdent').mockResolvedValue({
			...mockAccountRecovery,
			used_at: null,
		});

		jest.spyOn(userService, 'findById').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.ACTIVE,
		});
		jest.spyOn(accountService, 'updatePassword').mockResolvedValue(
			undefined,
		);
		jest.spyOn(accountRecoveryService, 'update').mockResolvedValue(
			{} as Partial<AccountRecoveryEntity>,
		);

		mockAccountEmailService();

		const response = await request(app).post(link).send({
			password: 'Secure@123!',
			password_confirm: 'Secure@123!',
		});

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.password_changed',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - passwordRecoverChange`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - passwordUpdate`, () => {
	const link = `${basePath}/password-update`;

	it('should fail if not authenticated', async () => {
		notAuthenticatedSpy(accountPolicy);

		const response = await request(app).post(link).send();

		expect(response.status).toBe(401);
	});

	it('should return error - password_invalid', async () => {
		isAuthenticatedSpy(accountPolicy);

		jest.spyOn(accountPolicy, 'getId').mockReturnValue(mockUser.id);
		jest.spyOn(userService, 'findById').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.ACTIVE,
		});
		jest.spyOn(accountService, 'checkPassword').mockResolvedValue(false);

		const response = await request(app).post(link).send({
			password_current: 'some_password',
			password_new: 'Secure@123!',
			password_confirm: 'Secure@123!',
		});

		try {
			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('success', false);
		} catch (error) {
			addDebugResponse(response, `${controller} - passwordUpdate`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should return success', async () => {
		isAuthenticatedSpy(accountPolicy);

		jest.spyOn(accountPolicy, 'getId').mockReturnValue(mockUser.id);
		jest.spyOn(userService, 'findById').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.ACTIVE,
		});
		jest.spyOn(accountService, 'checkPassword').mockResolvedValue(true);
		jest.spyOn(accountService, 'updatePassword').mockResolvedValue(
			undefined,
		);
		jest.spyOn(accountTokenService, 'setupAuthToken').mockResolvedValue(
			'some_token',
		);

		mockAccountEmailService();

		const response = await request(app).post(link).send({
			password_current: 'some_password',
			password_new: 'Secure@123!',
			password_confirm: 'Secure@123!',
		});

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.password_updated',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - passwordUpdate`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - emailConfirm`, () => {
	const link = `${basePath}/email-confirm/some_token_value`;
	const mockConfirmationTokenPayload = confirmationTokenPayloadMock;

	it('should fail - confirmation_token_invalid', async () => {
		const response = await request(app).post(link).send();

		try {
			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty(
				'message',
				'account.error.confirmation_token_invalid',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - emailConfirm`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should fail - confirmation_token_not_authorized', async () => {
		jest.spyOn(
			accountService,
			'determineConfirmationTokenPayload',
		).mockReturnValue(mockConfirmationTokenPayload);
		jest.spyOn(userService, 'findById').mockResolvedValue({
			...mockUser,
			email: 'not_matching@example.com',
		});

		const response = await request(app).post(link).send();

		try {
			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty(
				'message',
				'account.error.confirmation_token_not_authorized',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - emailConfirm`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should return success', async () => {
		jest.spyOn(
			accountService,
			'determineConfirmationTokenPayload',
		).mockReturnValue(mockConfirmationTokenPayload);
		jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
		jest.spyOn(userService, 'findById').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.PENDING,
		});

		const response = await request(app).post(link).send();

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.email_confirmed',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - emailConfirm`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - emailConfirmSend`, () => {
	const link = `${basePath}/email-confirm-send`;

	it('should fail if authenticated', async () => {
		isAuthenticatedSpy(accountPolicy);

		const response = await request(app).post(link).send();

		expect(response.status).toBe(403);
	});

	it('should fail - account not found', async () => {
		jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

		const response = await request(app).post(link).send({
			email: mockUser.email,
		});

		try {
			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty(
				'message',
				'account.error.not_found',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - emailConfirmSend`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should return success', async () => {
		jest.spyOn(userService, 'findByEmail').mockResolvedValue({
			...mockUser,
			status: UserStatusEnum.PENDING,
		});
		jest.spyOn(accountService, 'processEmailConfirmCreate').mockReturnValue(
			undefined,
		);

		const response = await request(app).post(link).send({
			email: mockUser.email,
		});

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.email_confirmation_sent',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - emailConfirmSend`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - emailUpdate`, () => {
	const link = `${basePath}/email-update`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).post(link).send();

		expect(response.status).toBe(401);
	});

	it('should fail - email_already_used', async () => {
		isAuthenticatedSpy(accountPolicy);

		jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);

		const response = await request(app).post(link).send({
			email_new: 'new-email@example.com',
		});

		try {
			expect(response.status).toBe(409);
			expect(response.body).toHaveProperty('success', false);
			expect(response.body).toHaveProperty(
				'message',
				'account.error.email_already_used',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - emailUpdate`);

			throw error; // Re-throw to fail the test
		}
	});

	it('should return success', async () => {
		isAuthenticatedSpy(accountPolicy);

		jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
		jest.spyOn(accountPolicy, 'getId').mockReturnValue(mockUser.id);
		jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
		jest.spyOn(accountService, 'createConfirmationToken').mockReturnValue({
			token: mockUuid(),
			expire_at: mockFutureDate(864000),
		});
		mockAccountEmailService();

		const response = await request(app).post(link).send({
			email_new: 'new-email@example.com',
		});

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.email_update_request',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - emailUpdate`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - meDetails`, () => {
	const link = `${basePath}/me`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).get(link).send();

		expect(response.status).toBe(401);
	});
});

describe(`${controller} - meSessions`, () => {
	const link = `${basePath}/me/sessions`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).get(link).send();

		expect(response.status).toBe(401);
	});

	it('should return success', async () => {
		isAuthenticatedSpy(accountPolicy);

		const mockAuthValidToken = authValidTokenMock;

		jest.spyOn(accountPolicy, 'getId').mockReturnValue(mockUser.id);
		jest.spyOn(accountTokenService, 'getAuthValidTokens').mockResolvedValue(
			[mockAuthValidToken],
		);

		const response = await request(app).get(link).send();

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveLength(1);
		} catch (error) {
			addDebugResponse(response, `${controller} - meSessions`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - meEdit`, () => {
	const link = `${basePath}/me/edit`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).post(link).send();

		expect(response.status).toBe(401);
	});

	it('should return success', async () => {
		isAuthenticatedSpy(accountPolicy);

		jest.spyOn(accountPolicy, 'getId').mockReturnValue(mockUser.id);
		jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
		jest.spyOn(userService, 'update').mockResolvedValue(mockUser);

		const response = await request(app).post(link).send({
			name: 'New name',
			language: 'ro',
		});

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.edit',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - meSessions`);

			throw error; // Re-throw to fail the test
		}
	});
});

describe(`${controller} - meDelete`, () => {
	const link = `${basePath}/me/delete`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).delete(link).send();

		expect(response.status).toBe(401);
	});

	it('should return success', async () => {
		isAuthenticatedSpy(accountPolicy);

		jest.spyOn(accountPolicy, 'getId').mockReturnValue(mockUser.id);
		jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
		jest.spyOn(accountService, 'checkPassword').mockResolvedValue(true);
		jest.spyOn(userService, 'delete').mockResolvedValue(undefined);

		const response = await request(app).delete(link).send({
			password_current: 'some_password',
		});

		try {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty(
				'message',
				'account.success.delete',
			);
		} catch (error) {
			addDebugResponse(response, `${controller} - meDelete`);

			throw error; // Re-throw to fail the test
		}
	});
});

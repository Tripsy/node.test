import app from '../../app';
import request from 'supertest';
import UserEntity from '../../entities/user.entity';
import {UserStatusEnum} from '../../enums/user-status.enum';
import UserRepository from '../../repositories/user.repository';
import * as accountService from '../../services/account.service';
import {AuthValidToken, ConfirmationTokenPayload} from '../../types/token.type';
import {routeLink} from '../../config/init-routes.config';
import {UserRoleEnum} from '../../enums/user-role.enum';
import AccountTokenRepository from '../../repositories/account-token.repository';
import AccountPolicy from '../../policies/account.policy';
import AccountRecoveryRepository from '../../repositories/account-recovery.repository';
import * as emailProvider from '../../providers/email.provider';
import AccountRecoveryEntity from '../../entities/account-recovery.entity';
import * as metaDataHelper from '../../helpers/meta-data.helper';
import jwt from 'jsonwebtoken';
import NotAllowedError from '../../exceptions/not-allowed.error';
import '../jest-functional.setup';

import * as settingsModule from '../../config/settings.config';
import {createFutureDate} from '../../helpers/date.helper';

jest.mock('jsonwebtoken');

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe('AccountController - register', () => {
    const accountRegisterLink = routeLink('account.register', {}, false);

    const testData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        password_confirm: 'Password123!',
        language: 'en',
    };

    const mockUser: UserEntity = {
        id: 1,
        name: 'John Doe',
        password: 'hashed-password',
        email: 'john.doe@example.com',
        status: UserStatusEnum.PENDING,
        language: 'en',
        role: UserRoleEnum.MEMBER,
        created_at: new Date(),
    };

    it('simulate existing user', async () => {
        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(accountRegisterLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('account.error.email_already_used');
    });

    it('should register a new user', async () => {
        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
        } as any);

        jest.spyOn(UserRepository, 'save').mockResolvedValue(mockUser);

        const response = await request(app)
            .post(accountRegisterLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.register');
        expect(response.body.data).toHaveProperty('name', mockUser.name);
    });
});

describe('AccountController - login', () => {
    const accountLoginLink = routeLink('account.login', {}, false);

    const testData = {
        email: 'john.doe@example.com',
        password: 'password123',
    };

    const mockUser: Partial<UserEntity> = {
        id: 1,
        email: 'john.doe@example.com',
        password: 'password123',
        status: UserStatusEnum.ACTIVE
    };

    const mockToken = 'test-token';

    const mockAuthValidTokens: AuthValidToken[] = [
        {
            ident: 'afa6b787-x123-x456-x789-b9a840284bb5',
            label: '',
            used_at: new Date
        },
    ];

    it('should fail if authenticated', async () => {
        jest.spyOn(AccountPolicy.prototype, 'login').mockImplementation(() => {
            throw new NotAllowedError('account.error.already_logged_in');
        });

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(403);
    });

    it('when user is not found', async () => {
        jest.spyOn(AccountPolicy.prototype, 'checkRateLimitOnLogin').mockImplementation();

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('user.error.not_found');
    });

    it('simulate user is not active', async () => {
        jest.spyOn(AccountPolicy.prototype, 'checkRateLimitOnLogin').mockImplementation();

        jest.replaceProperty(mockUser, 'status', UserStatusEnum.PENDING);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('account.error.not_active');
    });

    it('should return 401 Unauthorized with invalid credentials', async () => {
        jest.spyOn(AccountPolicy.prototype, 'checkRateLimitOnLogin').mockImplementation();

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(false);

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(401);
    });

    it('should login successfully with valid credentials', async () => {
        jest.spyOn(AccountPolicy.prototype, 'checkRateLimitOnLogin').mockImplementation();

        // Set a higher number than mockAuthValidTokens.length to avoid condition authValidTokens.length >= settings.user.maxActiveSessions
        jest.spyOn(settingsModule, 'cfg').mockImplementation((key) => {
            if (key === 'user.maxActiveSessions') {
                return 3;
            }

            return settingsModule.cfg(key);
        });

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(true);
        jest.spyOn(accountService, 'getAuthValidTokens').mockResolvedValue(mockAuthValidTokens);
        jest.spyOn(accountService, 'setupToken').mockResolvedValue(mockToken);

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.login');
        expect(response.body.data.token).toBe(mockToken);
    });

    it('simulate too many active sessions', async () => {
        jest.spyOn(AccountPolicy.prototype, 'checkRateLimitOnLogin').mockImplementation();

        // Set a number lower or equal than mockAuthValidTokens.length to trigger condition authValidTokens.length >= settings.user.maxActiveSessions
        jest.spyOn(settingsModule, 'cfg').mockImplementation((key) => {
            if (key === 'user.maxActiveSessions') {
                return 1;
            }

            return settingsModule.cfg(key);
        });

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(true);
        jest.spyOn(accountService, 'getAuthValidTokens').mockResolvedValue(mockAuthValidTokens);
        jest.spyOn(accountService, 'setupToken').mockResolvedValue(mockToken);

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(403);
        expect(response.body.message).toBe('account.error.max_active_sessions');
        expect(response.body.data.authValidTokens.map((item: AuthValidToken) => ({
            ...item,
            used_at: new Date(item.used_at),
        }))).toEqual(mockAuthValidTokens);
    });
});

describe('AccountController - removeToken', () => {
    const accountRemoveTokenLink = routeLink('account.removeToken', {}, false);

    const testData = {
        ident: 'c451f415-d8cc-4639-86bb-ec7779cb8eed',
    };

    it('should throw bad request on invalid ident', async () => {
        jest.replaceProperty(testData, 'ident', 'invalid-ident');

        const response = await request(app)
            .delete(accountRemoveTokenLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
    });

    it('should return success', async () => {
        jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue({
            filterByIdent: jest.fn().mockReturnThis(),
            delete: jest.fn().mockResolvedValue(1),
        } as any);

        const response = await request(app)
            .delete(accountRemoveTokenLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.token_deleted');
    });
});

describe('AccountController - logout', () => {
    const accountLogoutLink = routeLink('account.logout', {}, false);

    it('should fail if not authenticated', async () => {
        const response = await request(app)
            .delete(accountLogoutLink)
            .send();

        // Assertions
        expect(response.status).toBe(401);
    });

    it('should return success', async () => {
        jest.spyOn(AccountPolicy.prototype, 'logout').mockImplementation();

        jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue({
            filterBy: jest.fn().mockReturnThis(),
            delete: jest.fn().mockResolvedValue(1),
        } as any);

        const response = await request(app)
            .delete(accountLogoutLink)
            .send();

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.logout');
    });
});

describe('AccountController - passwordRecover', () => {
    const accountPasswordRecoverLink = routeLink('account.passwordRecover', {}, false);

    const testData = {
        email: 'sample@email.com',
    };

    const mockUser: Partial<UserEntity> = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        language: 'en',
        status: UserStatusEnum.PENDING
    };

    it('should return not found for pending user', async () => {
        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(accountPasswordRecoverLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('account.error.not_active');
    });

    it('should simulate recovery attempts exceeded', async () => {
        jest.replaceProperty(mockUser, 'status', UserStatusEnum.ACTIVE);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(settingsModule, 'cfg').mockImplementation((key) => {
            if (key === 'user.recoveryAttemptsInLastSixHours') {
                return 3;
            }

            return settingsModule.cfg(key);
        });

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterBy: jest.fn().mockReturnThis(),
            filterByRange: jest.fn().mockReturnThis(),
            count: jest.fn().mockResolvedValue(10),
        } as any);

        const response = await request(app)
            .post(accountPasswordRecoverLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.recovery_attempts_exceeded');
    });

    it('should return success', async () => {
        jest.replaceProperty(mockUser, 'status', UserStatusEnum.ACTIVE);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterBy: jest.fn().mockReturnThis(),
            filterByRange: jest.fn().mockReturnThis(),
            count: jest.fn().mockResolvedValue(0),
        } as any);

        jest.spyOn(accountService, 'setupRecovery').mockResolvedValue(['random-ident', new Date('2025-01-01T00:00:00Z')]);
        jest.spyOn(emailProvider, 'loadEmailTemplate').mockResolvedValue({
            templateId: 1,
            language: 'en',
            emailContent: {
                subject: 'Recover password',
                text: 'Recover password',
                html: 'Recover password',
            }
        });
        jest.spyOn(emailProvider, 'queueEmail').mockImplementation();

        const response = await request(app)
            .post(accountPasswordRecoverLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.password_recover');
    });
});

describe('AccountController - passwordRecoverChange', () => {
    const accountPasswordRecoverChange = routeLink('account.passwordRecoverChange', {
        ident: 'random-ident'
    }, false);

    const testData = {
        password: 'StrongP@ssw0rd',
        password_confirm: 'StrongP@ssw0rd',
    };

    const mockAccountRecovery: Partial<AccountRecoveryEntity> = {
        id: 1,
        ident: 'random-ident',
        user_id: 1,
        metadata: {
            email: 'john.doe@example.com'
        },
        used_at: undefined,
        expire_at: createFutureDate(3000),
    };

    const mockUser: Partial<UserEntity> = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        language: 'en',
        status: UserStatusEnum.PENDING
    };

    it('should throw bad request when recovery token was already used', async () => {
        jest.replaceProperty(mockAccountRecovery, 'used_at', new Date('2025-01-01T00:00:00Z'))

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecovery),
        } as any);

        const response = await request(app)
            .post(accountPasswordRecoverChange)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.recovery_token_used');
    });

    it('should throw bad request when recovery token is expired', async () => {
        jest.replaceProperty(mockAccountRecovery, 'expire_at', new Date('2024-01-01T00:00:00Z'));

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecovery),
        } as any);

        const response = await request(app)
            .post(accountPasswordRecoverChange)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.recovery_token_expired');
    });

    it('should throw bad request when token meta doesn\'t match', async () => {
        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecovery),
        } as any);

        jest.spyOn(settingsModule, 'cfg').mockImplementation((key) => {
            if (key === 'user.recoveryEnableMetadataCheck') {
                return true;
            }

            return settingsModule.cfg(key);
        });

        jest.spyOn(metaDataHelper, 'compareMetaDataValue').mockReturnValue(false);

        const response = await request(app)
            .post(accountPasswordRecoverChange)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.recovery_token_not_authorized');
    });

    it('should throw not found if user is not active', async () => {
        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecovery),
        } as any);

        jest.spyOn(settingsModule, 'cfg').mockImplementation((key) => {
            if (key === 'user.recoveryEnableMetadataCheck') {
                return false;
            }

            return settingsModule.cfg(key);
        });

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(accountPasswordRecoverChange)
            .send(testData);

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('account.error.not_found');
    });

    it('should return success', async () => {
        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecovery),
        } as any);

        jest.spyOn(settingsModule, 'cfg').mockImplementation((key) => {
            if (key === 'user.recoveryEnableMetadataCheck') {
                return false;
            }

            return settingsModule.cfg(key);
        });

        jest.replaceProperty(mockUser, 'status', UserStatusEnum.ACTIVE);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(UserRepository, 'save').mockImplementation();

        jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue({
            filterBy: jest.fn().mockReturnThis(),
            delete: jest.fn().mockResolvedValue(1),
        } as any);

        jest.spyOn(emailProvider, 'loadEmailTemplate').mockResolvedValue({
            templateId: 1,
            language: 'en',
            emailContent: {
                subject: 'Password changed',
                text: 'Password changed',
                html: 'Password changed',
            }
        });
        jest.spyOn(emailProvider, 'queueEmail').mockImplementation();

        const response = await request(app)
            .post(accountPasswordRecoverChange)
            .send(testData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.password_changed');
    });
});

describe('AccountController - passwordUpdate', () => {
    const accountPasswordUpdate = routeLink('account.passwordUpdate', {}, false);

    const testData = {
        old_password: '1OldP@ssw0rd',
        password: 'StrongP@ssw0rd',
        password_confirm: 'StrongP@ssw0rd',
    };

    const mockUser: Partial<UserEntity> = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        language: 'en',
        status: UserStatusEnum.ACTIVE
    };

    it('should fail if not authenticated', async () => {
        const response = await request(app)
            .post(accountPasswordUpdate)
            .send(testData);

        // Assertions
        expect(response.status).toBe(401);
    });

    it('should simulate invalid password', async () => {
        jest.spyOn(AccountPolicy.prototype, 'passwordUpdate').mockImplementation();

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(false);

        const response = await request(app)
            .post(accountPasswordUpdate)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            errors: expect.arrayContaining([
                { old_password: 'account.validation.old_password_invalid' }
            ])
        });
    });

    it('should return success', async () => {
        jest.spyOn(AccountPolicy.prototype, 'passwordUpdate').mockImplementation();

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(true);

        jest.spyOn(UserRepository, 'save').mockImplementation();

        jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue({
            filterBy: jest.fn().mockReturnThis(),
            delete: jest.fn().mockResolvedValue(1),
        } as any);

        jest.spyOn(UserRepository, 'save').mockImplementation();

        const mockToken = 'test-token';

        jest.spyOn(accountService, 'setupToken').mockResolvedValue(mockToken);

        const response = await request(app)
            .post(accountPasswordUpdate)
            .send(testData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.password_updated');
        expect(response.body.data.token).toBe(mockToken);
    });
});

describe('AccountController - emailConfirm', () => {
    const accountEmailConfirm = routeLink('account.emailConfirm', {
        token: 'test-token'
    }, false);

    const mockUser: Partial<UserEntity> = {
        id: 1,
        status: UserStatusEnum.PENDING
    };

    const confirmationTokenPayload: ConfirmationTokenPayload = {
        user_id: 1,
        user_email: 'some@email.test',
        user_email_new: undefined,
    };

    it('should simulate invalid payload', async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        const response = await request(app)
            .post(accountEmailConfirm)
            .send();

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.confirmation_token_invalid');
    });

    it('should simulate user is not found', async () => {
        (jwt.verify as jest.Mock).mockReturnValue(confirmationTokenPayload);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
        } as any);

        const response = await request(app)
            .post(accountEmailConfirm)
            .send();

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('account.error.not_found');
    });

    it('should return success with new email', async () => {
        (jwt.verify as jest.Mock).mockReturnValue(confirmationTokenPayload);

        jest.replaceProperty(confirmationTokenPayload, 'user_email_new', 'some-new@email.test');

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(UserRepository, 'save').mockImplementation();

        const response = await request(app)
            .post(accountEmailConfirm)
            .send();

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.email_updated');
    });

    it('should return bad request when account is already active', async () => {
        (jwt.verify as jest.Mock).mockReturnValue(confirmationTokenPayload);

        jest.replaceProperty(mockUser, 'status', UserStatusEnum.ACTIVE);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(accountEmailConfirm)
            .send();

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.already_active');
    });

    it('should return bad request when account is inactive', async () => {
        (jwt.verify as jest.Mock).mockReturnValue(confirmationTokenPayload);

        jest.replaceProperty(mockUser, 'status', UserStatusEnum.INACTIVE);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(accountEmailConfirm)
            .send();

        // Assertions
        expect(response.status).toBe(403);
    });

    it('should return success', async () => {
        (jwt.verify as jest.Mock).mockReturnValue(confirmationTokenPayload);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(UserRepository, 'save').mockImplementation();

        const response = await request(app)
            .post(accountEmailConfirm)
            .send();

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.email_confirmed');
    });
});

describe('AccountController - emailUpdate', () => {
    const accountEmailUpdate = routeLink('account.emailUpdate', {}, false);

    const testData = {
        email: 'some-new@email.com',
    };

    const mockUser: Partial<UserEntity> = {
        id: 1,
        name: 'John Doe',
        email: 'some@email.test',
        language: 'en',
    };

    it('should fail if not authenticated', async () => {
        const response = await request(app)
            .post(accountEmailUpdate)
            .send(testData);

        // Assertions
        expect(response.status).toBe(401);
    });

    it('should return error if (new) email is already used by another account', async () => {
        jest.spyOn(AccountPolicy.prototype, 'emailUpdate').mockImplementation();

        jest.replaceProperty(mockUser, 'id', 2);

        // Mock - query for existing user
        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterBy: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(accountEmailUpdate)
            .send(testData);

        // Assertions
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('account.error.email_already_used');
    });

    it('should return error if (new) email is the same', async () => {
        jest.spyOn(AccountPolicy.prototype, 'emailUpdate').mockImplementation();

        jest.replaceProperty(mockUser, 'email', 'some-new@email.com');

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterBy: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(accountEmailUpdate)
            .send(testData);

        // Assertions
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('account.error.email_same');
    });

    it('should return success', async () => {
        jest.spyOn(AccountPolicy.prototype, 'emailUpdate').mockImplementation();

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterBy: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(accountService, 'sendEmailConfirmUpdate').mockImplementation();

        const response = await request(app)
            .post(accountEmailUpdate)
            .send(testData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.email_update');
    });
});
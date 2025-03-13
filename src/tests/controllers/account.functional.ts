import app, {appReady, closeHandler, server} from '../../app';
import request from 'supertest';
import UserEntity from '../../entities/user.entity';
import {UserStatusEnum} from '../../enums/user-status.enum';
import UserRepository from '../../repositories/user.repository';
import * as accountService from '../../services/account.service';
import {settings} from '../../config/settings.config';
import {AuthValidToken} from '../../types/token.type';
import {routeLink} from '../../config/init-routes.config';
import {UserRoleEnum} from '../../enums/user-role.enum';
import AccountTokenRepository from '../../repositories/account-token.repository';
import AccountPolicy from '../../policies/account.policy';
import AccountRecoveryRepository from '../../repositories/account-recovery.repository';
import * as emailProvider from '../../providers/email.provider';
import AccountRecoveryEntity from '../../entities/account-recovery.entity';
import {createFutureDate} from '../../helpers/utils.helper';
import * as metaDataHelper from '../../helpers/meta-data.helper';

beforeAll(async () => {
    await appReady;
});

afterAll(async () => {
    if (server) {
        await new Promise<void>((resolve, reject) => {
            server.close(async (err) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        await closeHandler();

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        });
    } else {
        await closeHandler();
    }
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
});

describe.skip('AccountController - register', () => {
    const accountRegisterLink = routeLink('account.register', {}, false);

    const initTestData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        password_confirm: 'Password123!',
        language: 'en',
    };

    it('simulate existing user', async () => {
        // Create mock data
        const mockUser: Partial<UserEntity> = {
            id: 1,
            email: 'john.doe@example.com',
            status: UserStatusEnum.PENDING
        };

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const testData = {...initTestData};

        const response = await request(app)
            .post(accountRegisterLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('account.error.email_already_used');
    });

    it('should register a new user', async () => {
        // Create mock data
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

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
        } as any);

        jest.spyOn(UserRepository, 'save').mockResolvedValue(mockUser);

        const testData = {...initTestData};

        const response = await request(app)
            .post(accountRegisterLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.register');
        expect(response.body.data).toHaveProperty('name', mockUser.name);
    });
});

describe.skip('AccountController - login', () => {
    const accountLoginLink = routeLink('account.login', {}, false);

    const initTestData = {
        email: 'john.doe@example.com',
        password: 'password123',
    };

    it('when user is not found', async () => {
        const testData = {...initTestData};

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('user.error.not_found');
    });

    it('simulate user is not active', async () => {
        // Create mock data
        const mockUser: Partial<UserEntity> = {
            id: 1,
            email: 'john.doe@example.com',
            password: 'password123',
            status: UserStatusEnum.PENDING
        };

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const testData = {...initTestData};

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('account.error.not_active');
    });

    it('should return 401 Unauthorized with invalid credentials', async () => {
        // Create mock data
        const mockUser: Partial<UserEntity> = {
            id: 1,
            email: 'john.doe@example.com',
            password: 'password123',
            status: UserStatusEnum.ACTIVE
        };

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(false);

        const testData = {...initTestData};

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('account.error.not_authorized');
    });

    it('should login successfully with valid credentials', async () => {
        // Create mock data
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

        // Temporarily override settings
        const settingsUserMaxActiveSessions = settings.user.maxActiveSessions;
        settings.user.maxActiveSessions = 3; // Set a higher number than mockAuthValidTokens.length to avoid condition authValidTokens.length >= settings.user.maxActiveSessions

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(true);
        jest.spyOn(accountService, 'getAuthValidTokens').mockResolvedValue(mockAuthValidTokens);
        jest.spyOn(accountService, 'setupToken').mockResolvedValue(mockToken);

        const testData = {...initTestData};

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Restore original value after the test
        settings.user.maxActiveSessions = settingsUserMaxActiveSessions;

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.login');
        expect(response.body.data.token).toBe(mockToken);
    });

    it('simulate too many active sessions', async () => {
        // Create mock data
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

        // Temporarily override settings
        const settingsUserMaxActiveSessions = settings.user.maxActiveSessions;
        settings.user.maxActiveSessions = 1; // Set a number lower or equal than mockAuthValidTokens.length to trigger condition authValidTokens.length >= settings.user.maxActiveSessions

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(true);
        jest.spyOn(accountService, 'getAuthValidTokens').mockResolvedValue(mockAuthValidTokens);
        jest.spyOn(accountService, 'setupToken').mockResolvedValue(mockToken);

        const testData = {...initTestData};

        const response = await request(app)
            .post(accountLoginLink)
            .send(testData);

        // Restore original value after the test
        settings.user.maxActiveSessions = settingsUserMaxActiveSessions;

        // Assertions
        expect(response.status).toBe(403);
        expect(response.body.message).toBe('account.error.max_active_sessions');
        expect(response.body.data.authValidTokens.map((item: AuthValidToken) => ({
            ...item,
            used_at: new Date(item.used_at),
        }))).toEqual(mockAuthValidTokens);
    });
});

describe.skip('AccountController - removeToken', () => {
    const accountRemoveTokenLink = routeLink('account.removeToken', {}, false);

    const initTestData = {
        ident: 'c451f415-d8cc-4639-86bb-ec7779cb8eed',
    };

    it('should throw bad request on invalid ident', async () => {
        const testData = {...initTestData};

        testData.ident = 'invalid-ident';

        const response = await request(app)
            .delete(accountRemoveTokenLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
    });

    it('should return success', async () => {
        const testData = {...initTestData};

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

describe.skip('AccountController - logout', () => {
    const accountLogoutLink = routeLink('account.logout', {}, false);

    it('should return success', async () => {
        jest.spyOn(AccountPolicy.prototype, 'logout').mockImplementation(() => undefined);

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

describe.skip('AccountController - passwordRecover', () => {
    const accountPasswordRecoverLink = routeLink('account.passwordRecover', {}, false);

    const initTestData = {
        email: 'sample@email.com',
    };

    // Create mock data
    const mockUser: Partial<UserEntity> = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        language: 'en',
        status: UserStatusEnum.PENDING
    };

    it('should return not found for pending user', async () => {
        const testData = {...initTestData};

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
        const testData = {...initTestData};

        mockUser.status = UserStatusEnum.ACTIVE;

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        // Temporarily override settings
        const settingsUserRecoveryAttemptsInLastSixHours = settings.user.recoveryAttemptsInLastSixHours;
        settings.user.recoveryAttemptsInLastSixHours = 3;

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterBy: jest.fn().mockReturnThis(),
            filterByRange: jest.fn().mockReturnThis(),
            count: jest.fn().mockResolvedValue(10),
        } as any);

        const response = await request(app)
            .post(accountPasswordRecoverLink)
            .send(testData);

        // Restore original value after the test
        settings.user.recoveryAttemptsInLastSixHours = settingsUserRecoveryAttemptsInLastSixHours;

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.recovery_attempts_exceeded');
    });

    it('should return success', async () => {
        const testData = {...initTestData};

        mockUser.status = UserStatusEnum.ACTIVE;

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

describe.skip('AccountController - passwordRecoverChange', () => {
    const accountPasswordRecoverChange = routeLink('account.passwordRecoverChange', {
        ident: 'random-ident'
    }, false);

    const initTestData = {
        password: 'StrongP@ssw0rd',
        password_confirm: 'StrongP@ssw0rd',
    };

    // Create mock data
    const mockAccountRecovery: Partial<AccountRecoveryEntity> = {
        id: 1,
        ident: 'random-ident',
        user_id: 1,
        metadata: {
            email: 'john.doe@example.com'
        },
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
        const testData = {...initTestData};

        const mockAccountRecoveryUsedAt = {...mockAccountRecovery};
        mockAccountRecoveryUsedAt.used_at = new Date('2025-01-01T00:00:00Z');

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecoveryUsedAt),
        } as any);

        const response = await request(app)
            .post(accountPasswordRecoverChange)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.recovery_token_used');
    });

    it('should throw bad request when recovery token is expired', async () => {
        const testData = {...initTestData};

        const mockAccountRecoveryExpireAt = {...mockAccountRecovery};
        mockAccountRecoveryExpireAt.expire_at = new Date('2024-01-01T00:00:00Z');

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecoveryExpireAt),
        } as any);

        const response = await request(app)
            .post(accountPasswordRecoverChange)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.recovery_token_expired');
    });

    it('should throw bad request when token meta doesn\'t match', async () => {
        const testData = {...initTestData};

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecovery),
        } as any);

        // Temporarily override settings
        const settingsUserRecoveryEnableMetadataCheck = settings.user.recoveryEnableMetadataCheck;
        settings.user.recoveryEnableMetadataCheck = true;

        jest.spyOn(metaDataHelper, 'compareMetaDataValue').mockReturnValue(false);

        const response = await request(app)
            .post(accountPasswordRecoverChange)
            .send(testData);

        // Restore original value after the test
        settings.user.recoveryEnableMetadataCheck = settingsUserRecoveryEnableMetadataCheck;

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('account.error.recovery_token_not_authorized');
    });

    it('should throw not found if user is not active', async () => {
        const testData = {...initTestData};

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecovery),
        } as any);

        // Temporarily override settings
        const settingsUserRecoveryEnableMetadataCheck = settings.user.recoveryEnableMetadataCheck;
        settings.user.recoveryEnableMetadataCheck = false;

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(accountPasswordRecoverChange)
            .send(testData);

        // Restore original value after the test
        settings.user.recoveryEnableMetadataCheck = settingsUserRecoveryEnableMetadataCheck;

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('account.error.not_found');
    });

    it('should return success', async () => {
        const testData = {...initTestData};

        jest.spyOn(AccountRecoveryRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterByIdent: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockAccountRecovery),
        } as any);

        // Temporarily override settings
        const settingsUserRecoveryEnableMetadataCheck = settings.user.recoveryEnableMetadataCheck;
        settings.user.recoveryEnableMetadataCheck = false;

        mockUser.status = UserStatusEnum.ACTIVE;

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

        // Restore original value after the test
        settings.user.recoveryEnableMetadataCheck = settingsUserRecoveryEnableMetadataCheck;

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('account.success.password_changed');
    });
});

describe('AccountController - passwordUpdate', () => {
    // TODO
});

// describe('AccountController - emailConfirm', () => {
// });
//
// describe('AccountController - emailUpdate', () => {
// });
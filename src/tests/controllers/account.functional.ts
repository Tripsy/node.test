import app, {appReady, closeHandler, server} from '../../app';
import request from 'supertest';
import UserEntity from '../../entities/user.entity';
import {UserStatusEnum} from '../../enums/user-status.enum';
import UserRepository from '../../repositories/user.repository';
import * as accountService from '../../services/account.service';
import {settings} from '../../config/settings.config';
import {AuthValidToken} from '../../types/token.type';
import {routeLink} from '../../config/init-routes.config';
import {lang} from '../../config/i18n-setup.config';
import {UserRoleEnum} from '../../enums/user-role.enum';

beforeAll(async () => {
    await appReady; // Wait for the app to fully initialize
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

describe('AccountController - Register', () => {
    const accountRegisterLink = routeLink('account.register', {}, false);

    const initTestData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        password_confirm: 'Password123!',
        language: 'en',
    };

    it('should fail validation', async () => {
        const testData = {...initTestData};

        // @ts-ignore
        delete testData.name;

        const response = await request(app)
            .post(accountRegisterLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.errors).toContainEqual(
            expect.objectContaining({
                message: lang('user.validation.name_invalid')
            })
        );
    });

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

describe.skip('AccountController - Login', () => {
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

    it('simulate use is not active', async () => {
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
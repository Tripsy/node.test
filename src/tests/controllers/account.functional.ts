import app, {appReady, closeHandler, server} from '../../app';
import request from 'supertest';
import UserEntity from '../../entities/user.entity';
import {UserStatusEnum} from '../../enums/user-status.enum';
import UserRepository from '../../repositories/user.repository';
import * as accountService from '../../services/account.service';
import {settings} from '../../config/settings.config';
import {AuthValidToken} from '../../types/token.type';

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

describe('AccountController - Login', () => {
    it('when user is not found', async () => {
        // Create mock data
        const mockUser: Partial<UserEntity> = {
            id: 1,
            email: 'john.doe@example.com',
            password: 'password123',
            status: UserStatusEnum.ACTIVE
        };

        const response = await request(app)
            .post('/account/login') // TODO
            .send({
                email: 'john.doe@example.com',
                password: 'password123',
            });

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
            firstOrFail: jest.fn().mockResolvedValue(mockUser), // Resolve with mock user
        } as any);

        const response = await request(app)
            .post('/account/login') // TODO
            .send({
                email: 'john.doe@example.com',
                password: 'password123',
            });

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
            firstOrFail: jest.fn().mockResolvedValue(mockUser), // Resolve with mock user
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(false);

        const response = await request(app)
            .post('/account/login') // TODO
            .send({
                email: 'john.doe@example.com',
                password: 'password123',
            });

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
            firstOrFail: jest.fn().mockResolvedValue(mockUser), // Resolve with mock user
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(true);
        jest.spyOn(accountService, 'getAuthValidTokens').mockResolvedValue(mockAuthValidTokens);
        jest.spyOn(accountService, 'setupToken').mockResolvedValue(mockToken);

        const response = await request(app)
            .post('/account/login') // TODO
            .send({
                email: 'john.doe@example.com',
                password: 'password123',
            });

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
            firstOrFail: jest.fn().mockResolvedValue(mockUser), // Resolve with mock user
        } as any);

        jest.spyOn(accountService, 'verifyPassword').mockResolvedValue(true);
        jest.spyOn(accountService, 'getAuthValidTokens').mockResolvedValue(mockAuthValidTokens);
        jest.spyOn(accountService, 'setupToken').mockResolvedValue(mockToken);

        const response = await request(app)
            .post('/account/login') // TODO
            .send({
                email: 'john.doe@example.com',
                password: 'password123',
            });

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
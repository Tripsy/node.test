import app from '../../app';
import request from 'supertest';
import {routeLink} from '../../config/init-routes.config';
import {UserStatusEnum} from '../../enums/user-status.enum';
import UserRepository from '../../repositories/user.repository';
import UserEntity from '../../entities/user.entity';
import UserPolicy from '../../policies/user.policy';
import {UserRoleEnum} from '../../enums/user-role.enum';
import {cacheProvider} from '../../providers/cache.provider';
import NotFoundError from '../../exceptions/not-found.error';
import AccountTokenRepository from '../../repositories/account-token.repository';
import '../jest-functional.setup';

jest.mock('../../policies/account.policy');

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.spyOn(UserPolicy.prototype, 'isAuthenticated').mockReturnValue(true);
    jest.spyOn(UserPolicy.prototype, 'isAdmin').mockReturnValue(true);
    jest.spyOn(UserPolicy.prototype, 'hasPermission').mockReturnValue(false);
});

describe.skip('UserController - create', () => {
    const userCreateLink = routeLink('user.create', {}, false);

    const testData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        password_confirm: 'Password123!',
        language: 'en',
        status: UserStatusEnum.PENDING,
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

    it('should fail if not authenticated', async () => {
        jest.spyOn(UserPolicy.prototype, 'isAuthenticated').mockReturnValue(false);

        const response = await request(app)
            .post(userCreateLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(401);
    });

    it('should fail if it doesn\'t have proper permission', async () => {
        jest.spyOn(UserPolicy.prototype, 'isAdmin').mockReturnValue(false);

        const response = await request(app)
            .post(userCreateLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(403);
    });

    it('should return error if (new) email is already used by another account', async () => {
        jest.replaceProperty(mockUser, 'id', 2);

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .post(userCreateLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('user.error.email_already_used');
    });

    it('should return success', async () => {
        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
        } as any);

        jest.spyOn(UserRepository, 'save').mockResolvedValue(mockUser);

        const response = await request(app)
            .post(userCreateLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('user.success.create');
        expect(response.body.data).toHaveProperty('name', mockUser.name);
    });
});

describe.skip('UserController - read', () => {
    const userReadLink = routeLink('user.read', {
        id: 1,
    }, false);

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

    it('should fail if not authenticated', async () => {
        jest.spyOn(UserPolicy.prototype, 'isAuthenticated').mockReturnValue(false);

        const response = await request(app)
            .get(userReadLink)
            .send();

        // Assertions
        expect(response.status).toBe(401);
    });

    it('should fail if it doesn\'t have proper permission', async () => {
        jest.spyOn(UserPolicy.prototype, 'isAdmin').mockReturnValue(false);

        const response = await request(app)
            .get(userReadLink)
            .send();

        // Assertions
        expect(response.status).toBe(403);
    });

    it('should return success', async () => {
        jest.spyOn(cacheProvider, 'buildKey').mockReturnValue('user-cache-key');
        jest.spyOn(cacheProvider, 'get').mockImplementation(async (key, fallbackFunction) => {
            return await fallbackFunction(); // Simulating cache miss
        });

        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            filterById: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
        } as any);

        jest.spyOn(UserRepository, 'save').mockResolvedValue(mockUser);

        const response = await request(app)
            .get(userReadLink)
            .send();

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('name', mockUser.name);
    });
});

describe.skip('UserController - update', () => {
    const userUpdateLink = routeLink('user.update', {
        id: 1
    }, false);

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

    it('should return 404 if user is not found', async () => {
        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockImplementation(() => {
                throw new NotFoundError();
            }),
        } as any);

        const response = await request(app)
            .put(userUpdateLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(404);
    });

    it('should return error if email is already used by another account', async () => {
        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
            filterBy: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockUser),
        } as any);

        const response = await request(app)
            .put(userUpdateLink)
            .send(testData);

        // Assertions
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('user.error.email_already_used');
    });

    it('should return success', async () => {
        jest.spyOn(UserRepository, 'createQuery').mockReturnValue({
            select: jest.fn().mockReturnThis(),
            filterById: jest.fn().mockReturnThis(),
            firstOrFail: jest.fn().mockResolvedValue(mockUser),
            filterBy: jest.fn().mockReturnThis(),
            filterByEmail: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
        } as any);

        jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue({
            filterBy: jest.fn().mockReturnThis(),
            delete: jest.fn().mockResolvedValue(1),
        } as any);

        jest.spyOn(UserRepository, 'save').mockResolvedValue(mockUser);

        const response = await request(app)
            .put(userUpdateLink)
            .send(testData);

        console.log(response.body);

        // Assertions
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('user.success.update');
        expect(response.body.data).toHaveProperty('name', mockUser.name);
    });
});

describe('UserController - delete', () => {
    // TODO
});

describe('UserController - find', () => {
    // TODO
});

describe('UserController - statusUpdate', () => {
    // TODO
});
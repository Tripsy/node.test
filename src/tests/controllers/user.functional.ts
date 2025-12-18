import request from 'supertest';
import app from '@/app';
import NotFoundError from '@/exceptions/not-found.error';
import AccountTokenRepository from '@/features/account/account-token.repository';
import type UserEntity from '@/features/user/user.entity';
import { UserRoleEnum, UserStatusEnum } from '@/features/user/user.entity';
import UserPolicy from '@/features/user/user.policy';
import * as cacheProvider from '@/providers/cache.provider';
import '../jest-functional.setup';
import {
	getUserRepository,
	type UserQuery,
} from '@/features/user/user.repository';
import { routeLink } from '@/helpers/routing.helper';

beforeEach(() => {
	jest.clearAllMocks();
	jest.restoreAllMocks();

	jest.spyOn(UserPolicy.prototype, 'isAuthenticated').mockReturnValue(true);
	jest.spyOn(UserPolicy.prototype, 'isAdmin').mockReturnValue(true);
	jest.spyOn(UserPolicy.prototype, 'hasPermission').mockReturnValue(false);
});

describe('UserController - create', () => {
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
		password_updated_at: new Date(),
		email: 'john.doe@example.com',
		email_verified_at: new Date(),
		status: UserStatusEnum.PENDING,
		language: 'en',
		role: UserRoleEnum.MEMBER,
		operator_type: null,
		created_at: new Date(),
		updated_at: null,
		deleted_at: null,
	};

	it('should fail if not authenticated', async () => {
		jest.spyOn(UserPolicy.prototype, 'isAuthenticated').mockReturnValue(
			false,
		);

		const response = await request(app).post(userCreateLink).send(testData);

		// Assertions
		expect(response.status).toBe(401);
	});

	it("should fail if it doesn't have proper permission", async () => {
		jest.spyOn(UserPolicy.prototype, 'isAdmin').mockReturnValue(false);

		const response = await request(app).post(userCreateLink).send(testData);

		// Assertions
		expect(response.status).toBe(403);
	});

	it('should return error if (new) email is already used by another account', async () => {
		jest.replaceProperty(mockUser, 'id', 2);

		const mockQueryBuilderUser = {
			filterByEmail: jest.fn().mockReturnThis(),
			withDeleted: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(mockUser),
		} as unknown as UserQuery;

		jest.spyOn(getUserRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		const response = await request(app).post(userCreateLink).send(testData);

		// Assertions
		expect(response.status).toBe(409);
		expect(response.body.message).toBe('user.error.email_already_used');
	});

	it('should return success', async () => {
		const mockQueryBuilderUser = {
			filterByEmail: jest.fn().mockReturnThis(),
			withDeleted: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(null),
		} as unknown as UserQuery;

		jest.spyOn(getUserRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		jest.spyOn(getUserRepository(), 'save').mockResolvedValue(mockUser);

		const response = await request(app).post(userCreateLink).send(testData);

		// Assertions
		expect(response.status).toBe(201);
		expect(response.body.message).toBe('user.success.create');
		expect(response.body.data).toHaveProperty('name', mockUser.name);
	});
});

describe('UserController - read', () => {
	const userReadLink = routeLink(
		'user.read',
		{
			id: 1,
		},
		false,
	);

	const mockUser: UserEntity = {
		id: 1,
		name: 'John Doe',
		password: 'hashed-password',
		password_updated_at: new Date(),
		email: 'john.doe@example.com',
		email_verified_at: new Date(),
		status: UserStatusEnum.PENDING,
		language: 'en',
		role: UserRoleEnum.MEMBER,
		operator_type: null,
		created_at: new Date(),
		updated_at: null,
		deleted_at: null,
	};

	it('should fail if not authenticated', async () => {
		jest.spyOn(UserPolicy.prototype, 'isAuthenticated').mockReturnValue(
			false,
		);

		const response = await request(app).get(userReadLink).send();

		// Assertions
		expect(response.status).toBe(401);
	});

	it("should fail if it doesn't have proper permission", async () => {
		jest.spyOn(UserPolicy.prototype, 'isAdmin').mockReturnValue(false);

		const response = await request(app).get(userReadLink).send();

		// Assertions
		expect(response.status).toBe(403);
	});

	it('should return success', async () => {
		jest.spyOn(cacheProvider, 'getCacheProvider').mockReturnValue({
			buildKey: jest.fn().mockReturnValue('cache-key'),
			get: jest
				.fn()
				.mockImplementation(async (_key, fallbackFunction) => {
					return await fallbackFunction();
				}),
		} as Partial<
			ReturnType<typeof cacheProvider.getCacheProvider>
		> as ReturnType<typeof cacheProvider.getCacheProvider>);

		const mockQueryBuilderUser = {
			filterById: jest.fn().mockReturnThis(),
			withDeleted: jest.fn().mockReturnThis(),
			firstOrFail: jest.fn().mockResolvedValue(mockUser),
		} as unknown as UserQuery;

		jest.spyOn(getUserRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		const response = await request(app).get(userReadLink).send();

		// Assertions
		expect(response.status).toBe(200);
		expect(response.body.data).toHaveProperty('name', mockUser.name);
	});
});

describe('UserController - update', () => {
	const userUpdateLink = routeLink(
		'user.update',
		{
			id: 1,
		},
		false,
	);

	const testData = {
		name: 'John Doe',
		email: 'john.doe@example.com',
		password: 'Password123!',
		password_confirm: 'Password123!',
		language: 'en',
		role: UserRoleEnum.MEMBER,
	};

	const mockUser: UserEntity = {
		id: 1,
		name: 'John Doe',
		password: 'hashed-password',
		password_updated_at: new Date(),
		email: 'john.doe@example.com',
		email_verified_at: new Date(),
		status: UserStatusEnum.PENDING,
		language: 'en',
		role: UserRoleEnum.MEMBER,
		operator_type: null,
		created_at: new Date(),
		updated_at: null,
		deleted_at: null,
	};

	it('should return 404 if user is not found', async () => {
		const mockQueryBuilderUser = {
			select: jest.fn().mockReturnThis(),
			filterById: jest.fn().mockReturnThis(),
			firstOrFail: jest.fn().mockImplementation(() => {
				throw new NotFoundError();
			}),
		} as unknown as UserQuery;

		jest.spyOn(getUserRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		const response = await request(app).put(userUpdateLink).send(testData);

		// Assertions
		expect(response.status).toBe(404);
	});

	it('should return error if email is already used by another account', async () => {
		const mockQueryBuilderUser = {
			select: jest.fn().mockReturnThis(),
			filterById: jest.fn().mockReturnThis(),
			firstOrFail: jest.fn().mockResolvedValue(mockUser),
			filterBy: jest.fn().mockReturnThis(),
			filterByEmail: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(mockUser),
		} as unknown as UserQuery;

		jest.spyOn(getUserRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		const response = await request(app).put(userUpdateLink).send(testData);

		// Assertions
		expect(response.status).toBe(409);
		expect(response.body.message).toBe('user.error.email_already_used');
	});

	it('should return success', async () => {
		const mockQueryBuilderUser = {
			select: jest.fn().mockReturnThis(),
			filterById: jest.fn().mockReturnThis(),
			firstOrFail: jest.fn().mockResolvedValue(mockUser),
			filterBy: jest.fn().mockReturnThis(),
			filterByEmail: jest.fn().mockReturnThis(),
			first: jest.fn().mockResolvedValue(null),
		} as unknown as UserQuery;

		jest.spyOn(getUserRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		const mockQueryBuilderAccountToken = {
			filterBy: jest.fn().mockReturnThis(),
			delete: jest.fn().mockResolvedValue(1),
		} as jest.MockedObject<
			ReturnType<typeof AccountTokenRepository.createQuery>
		>;

		jest.spyOn(AccountTokenRepository, 'createQuery').mockReturnValue(
			mockQueryBuilderAccountToken,
		);

		jest.spyOn(getUserRepository(), 'save').mockResolvedValue(mockUser);

		const response = await request(app).put(userUpdateLink).send(testData);

		// Assertions
		expect(response.status).toBe(200);
		expect(response.body.message).toBe('user.success.update');
		expect(response.body.data).toHaveProperty('name', mockUser.name);
	});
});

describe('UserController - delete', () => {
	const userDeleteLink = routeLink(
		'user.delete',
		{
			id: 1,
		},
		false,
	);

	it('should fail if not authenticated', async () => {
		jest.spyOn(UserPolicy.prototype, 'isAuthenticated').mockReturnValue(
			false,
		);

		const response = await request(app).delete(userDeleteLink).send();

		// Assertions
		expect(response.status).toBe(401);
	});

	it('should return success', async () => {
		const mockQueryBuilderUser = {
			filterById: jest.fn().mockReturnThis(),
			delete: jest.fn().mockResolvedValue(1),
		} as unknown as UserQuery;

		jest.spyOn(getUserRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		const response = await request(app).delete(userDeleteLink).send();

		// Assertions
		expect(response.status).toBe(200);
		expect(response.body.message).toBe('user.success.delete');
	});
});

describe('UserController - restore', () => {
	const userRestoreLink = routeLink(
		'user.restore',
		{
			id: 1,
		},
		false,
	);

	it('should fail if not authenticated', async () => {
		jest.spyOn(UserPolicy.prototype, 'isAuthenticated').mockReturnValue(
			false,
		);

		const response = await request(app).patch(userRestoreLink).send();

		// Assertions
		expect(response.status).toBe(401);
	});

	it('should return success', async () => {
		const mockQueryBuilderUser = {
			filterById: jest.fn().mockReturnThis(),
			restore: jest.fn().mockResolvedValue(1),
		} as unknown as UserQuery;

		jest.spyOn(getUserRepository(), 'createQuery').mockReturnValue(
			mockQueryBuilderUser,
		);

		const response = await request(app).patch(userRestoreLink).send();

		// Assertions
		expect(response.status).toBe(200);
		expect(response.body.message).toBe('user.success.restore');
	});
});

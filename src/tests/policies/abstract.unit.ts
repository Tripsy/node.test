import type { Request } from 'express';
import PolicyAbstract from '../../abstracts/policy.abstract';
import NotAllowedError from '../../exceptions/not-allowed.error';
import UnauthorizedError from '../../exceptions/unauthorized.error';
import { UserRoleEnum } from '../../features/user/user-role.enum';

describe('PolicyAbstract', () => {
	describe('checks around admin role', () => {
		const req = {
			user: {
				id: 1,
				role: UserRoleEnum.ADMIN,
				permissions: ['entity.create', 'entity.read'],
			},
		} as unknown as Request;

		const policy = new PolicyAbstract(req, 'entity');

		it('should initialize properties correctly', () => {
			expect(policy.getUserId()).toBe(1); // Check userId
			expect(policy.isAdmin()).toBe(true); // Check admin role
			expect(policy.isOwner(1)).toBe(true); // Check owner
			expect(policy.isOwner(2)).toBe(false); // Check non-owner
			expect(policy.isAuthenticated()).toBe(true); // Check authentication

			expect(policy.permission('create')).toBe('entity.create'); // Check permission string
			expect(policy.permission('delete', 'user')).toBe('user.delete'); // Check permission string
		});

		it('should allow admin to create entity', () => {
			expect(() => policy.create()).not.toThrow();
		});

		test('hasPermission', () => {
			expect(policy.hasPermission('entity.create')).toBe(true);
			expect(policy.hasPermission('entity.destroy')).toBe(false);
		});
	});

	describe('checks when not authenticated', () => {
		const req = {
			user: {
				id: null,
			},
		} as unknown as Request;

		const policy = new PolicyAbstract(req, 'entity');

		it('should not be authenticated', () => {
			expect(policy.isAuthenticated()).toBe(false);
			expect(policy.isVisitor()).toBe(true);
		});

		test('not allowed', () => {
			expect(() => policy.create()).toThrow(UnauthorizedError);
			expect(() => policy.read()).toThrow(UnauthorizedError);
			expect(() => policy.update()).toThrow(UnauthorizedError);
			expect(() => policy.delete()).toThrow(UnauthorizedError);
			expect(() => policy.find()).toThrow(UnauthorizedError);
		});
	});

	describe('checks around user role', () => {
		const req = {
			user: {
				id: 1,
				role: UserRoleEnum.MEMBER,
			},
		} as unknown as Request;

		const policy = new PolicyAbstract(req, 'entity');

		test('isAllowed', () => {
			expect(policy.isAllowed('entity.read', 1)).toBe(true);
			expect(policy.isAllowed('entity.update', 2)).toBe(false);
		});

		test('if authorized', () => {
			expect(() => policy.create()).toThrow(NotAllowedError);
			expect(() => policy.read()).toThrow(NotAllowedError);
			expect(() => policy.read('entity', 1)).not.toThrow();
			expect(() => policy.update()).toThrow(NotAllowedError);
			expect(() => policy.delete()).toThrow(NotAllowedError);
			expect(() => policy.find()).toThrow(NotAllowedError);
		});
	});

	describe('checks around user permissions', () => {
		const req = {
			user: {
				id: 1,
				role: UserRoleEnum.MEMBER,
				permissions: ['entity.create', 'entity.read'],
			},
		} as unknown as Request;

		const policy = new PolicyAbstract(req, 'entity');

		test('isAllowed', () => {
			expect(policy.isAllowed('entity.read')).toBe(true);
			expect(policy.isAllowed('entity.update')).toBe(false);
		});

		test('if authorized', () => {
			expect(() => policy.create()).not.toThrow();
			expect(() => policy.read()).not.toThrow();
			expect(() => policy.update()).toThrow(NotAllowedError);
			expect(() => policy.delete()).toThrow(NotAllowedError);
			expect(() => policy.find()).toThrow(NotAllowedError);
		});
	});
});

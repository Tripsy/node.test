import type { Request } from 'express';
import { UserRoleEnum } from '../enums/user-role.enum';
import NotAllowedError from '../exceptions/not-allowed.error';
import UnauthorizedError from '../exceptions/unauthorized.error';

class AbstractPolicy {
	protected entity: string;

	readonly userId: number | null;
	readonly userRole: UserRoleEnum | 'visitor';
	readonly userPermissions: string[];

	constructor(req: Request, entity: string) {
		this.entity = entity;
		this.userId = req.user?.id || null;
		this.userRole = req.user?.role || 'visitor';
		this.userPermissions = req.user?.permissions || [];
	}

	public getUserId(): number | null {
		return this.userId;
	}

	public permission(operation: string, entity?: string): string {
		return `${entity || this.entity}.${operation}`;
	}

	public isAuthenticated(): boolean {
		return this.userId !== null;
	}

	public isVisitor(): boolean {
		return this.userRole === 'visitor';
	}

	public isAdmin(): boolean {
		return this.userRole === UserRoleEnum.ADMIN;
	}

	protected isOperator(): boolean {
		return this.userRole === UserRoleEnum.OPERATOR;
	}

	/**
	 * Returns `true` if is operator and owns the permission
	 *
	 * @param permission (eg: `user.delete`, `user.update`, etc...)
	 */
	public hasPermission(permission: string): boolean {
		if (!/^[^.]+\.[^.]+$/.test(permission)) {
			throw new Error(`Invalid permission format: ${permission}`);
		}

		return this.userPermissions.includes(permission);
	}

	/**
	 * Returns `true` if the user is the owner of the resource
	 */
	public isOwner(user_id?: number): boolean {
		return this.userId === user_id;
	}

	/**
	 * Returns `true` if the user is admin or has the `delete` permission on selected entity
	 * This method is used to allow view of soft deleted resources
	 */
	public allowDeleted(): boolean {
		return (
			this.isAdmin() ||
			this.hasPermission(this.permission('delete', this.entity))
		);
	}

	/**
	 * Check if user is allowed to perform the operation
	 * Returns `true` if the user is admin or the user is the owner of the resource or owns the permission
	 */
	public isAllowed(permission: string, user_id?: number): boolean {
		return (
			this.isOwner(user_id) ||
			this.isAdmin() ||
			this.hasPermission(permission)
		);
	}

	public create(entity?: string): void {
		if (!this.isAuthenticated()) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('create', entity);

		if (!this.isAdmin() && !this.hasPermission(permission)) {
			throw new NotAllowedError();
		}
	}

	public read(entity?: string, user_id?: number): void {
		if (!this.isAuthenticated()) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('read', entity);

		if (!this.isAllowed(permission, user_id)) {
			throw new NotAllowedError();
		}
	}

	public update(entity?: string, user_id?: number): void {
		if (!this.isAuthenticated()) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('update', entity);

		if (!this.isAllowed(permission, user_id)) {
			throw new NotAllowedError();
		}
	}

	public delete(entity?: string, user_id?: number): void {
		if (!this.isAuthenticated()) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('delete', entity);

		if (!this.isAllowed(permission, user_id)) {
			throw new NotAllowedError();
		}
	}

	/**
	 * Restore action is the same as delete
	 *
	 * @param entity
	 * @param user_id
	 */
	public restore(entity?: string, user_id?: number): void {
		this.delete(entity, user_id);
	}

	public find(entity?: string): void {
		if (!this.isAuthenticated()) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('find', entity);

		if (!this.isAllowed(permission)) {
			throw new NotAllowedError();
		}
	}
}

export default AbstractPolicy;

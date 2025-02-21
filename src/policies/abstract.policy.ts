import {Request} from 'express';
import {UserRoleEnum} from '../enums/user-role.enum';
import UnauthorizedError from '../exceptions/unauthorized.error';
import NotAllowedError from '../exceptions/not-allowed.error';

class AbstractPolicy {
    protected entity: string;

    readonly userId: number;
    readonly userRole: UserRoleEnum | 'visitor';
    readonly userPermissions: string[];
    readonly isAuthenticated: boolean;

    constructor(req: Request, entity: string) {
        this.entity = entity;
        this.userId = req.user?.id || 0;
        this.userRole = req.user?.role || 'visitor';
        this.userPermissions = req.user?.permissions || [];
        this.isAuthenticated = this.userId > 0;
    }

    protected isVisitor(): boolean {
        return this.userRole === 'visitor';
    }

    protected isAdmin(): boolean {
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
    protected hasPermission(permission: string): boolean {
        if (!/^[^.]+\.[^.]+$/.test(permission)) {
            throw new Error(`Invalid permission format: ${permission}`);
        }

        return this.isOperator() && this.userPermissions.includes(permission);
    }

    /**
     * Returns `true` if the user is the owner of the resource
     */
    protected isOwner(user_id?: number): boolean {
        return user_id !== undefined && this.userId === user_id;
    }

    /**
     * Check if user is allowed to perform the action
     * Returns `true` if the user is admin or the user is the owner of the resource or owns the permission
     */
    protected isAllowed(permission: string, user_id?: number): boolean {
        return this.isOwner(user_id) || this.isAdmin() || this.hasPermission(permission);
    }

    protected useError() {
        if (this.isAuthenticated) {
            throw new NotAllowedError();
        }

        throw new UnauthorizedError();
    }

    public create(entity?: string): void {
        const permission = (entity || this.entity) + '.create';

        if (!this.isAdmin() && !this.hasPermission(permission)) {
            this.useError();
        }
    }

    public read(entity?: string, user_id?: number): void {
        const permission = (entity || this.entity) + '.read';

        if (!this.isAllowed(permission, user_id)) {
            this.useError();
        }
    }

    public update(entity?: string, user_id?: number): void {
        const permission = (entity || this.entity) + '.update';

        if (!this.isAllowed(permission, user_id)) {
            this.useError();
        }
    }

    public delete(entity?: string, user_id?: number): void {
        const permission = (entity || this.entity) + '.delete';

        if (!this.isAllowed(permission, user_id)) {
            this.useError();
        }
    }

    public find(entity?: string, user_id?: number): void {
        const permission: string = (entity || this.entity) + '.find';

        if (!this.isAllowed(permission, user_id)) {
            this.useError();
        }
    }
}

export default AbstractPolicy;
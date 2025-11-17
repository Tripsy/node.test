import type { UserRoleEnum } from '../enums/user-role.enum';

export type UserRequest = {
	id: number;
	email: string;
	name: string;
	language: string;
	role: UserRoleEnum | 'visitor';
	permissions: string[];
};

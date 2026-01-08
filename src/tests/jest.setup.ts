import { createFutureDate, createPastDate } from '@/lib/helpers';

export function mockPastDate(t: number = 86400): Date {
	return createPastDate(t);
}

export function mockFutureDate(t: number = 86400): Date {
	return createFutureDate(t);
}

export function mockUuid(): string {
    return '123e4567-e89b-12d3-a456-426614174000';
}

// import { jest } from '@jest/globals';

// export function createAuthContext(
// 	partialAuth?: Partial<AuthContext>,
// ): AuthContext {
// 	return {
// 		id: 0,
// 		email: '',
// 		name: '',
// 		language: 'en',
// 		role: 'visitor',
// 		operator_type: null,
// 		permissions: [],
// 		activeToken: '',
// 		...partialAuth,
// 	};
// }

// jest.mock('i18next', () => ({
// 	t: (key: string) => key,
// 	language: 'en',
// 	options: { ns: [] },
// }));
//
// jest.mock('i18next-fs-backend', () => ({}));
// jest.mock('i18next-http-middleware', () => ({
// 	LanguageDetector: jest.fn(),
// }));

// import type UserEntity from '@/features/user/user.entity';
// import { UserRoleEnum, UserStatusEnum } from '@/features/user/user.entity';
// import {createFutureDate, createPastDate} from '@/lib/helpers';

//
// export function createMockUser(): UserEntity {
// 	const pastDate = mockPastDate();
//
// 	return {
//         id: "1",
// 		created_at: pastDate,
// 		deleted_at: null,
// 		email_verified_at: pastDate,
// 		operator_type: null,
// 		password_updated_at: pastDate,
// 		role: UserRoleEnum.MEMBER,
// 		status: UserStatusEnum.ACTIVE,
// 		updated_at: pastDate,
// 		name: 'John Doe',
// 		email: 'johndoe@example.com',
// 		password: 'StrongP@ssw0rd',
// 		language: 'en',
// 	};
// }

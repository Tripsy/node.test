import { jest } from '@jest/globals';
import type UserEntity from '@/features/user/user.entity';
import { UserRoleEnum, UserStatusEnum } from '@/features/user/user.entity';
import { createPastDate } from '@/lib/helpers';

jest.mock('i18next', () => ({
	t: (key: string) => key,
	language: 'en',
	options: { ns: [] },
}));

jest.mock('i18next-fs-backend', () => ({}));
jest.mock('i18next-http-middleware', () => ({
	LanguageDetector: jest.fn(),
}));

export function mockPastDate(): Date {
	return createPastDate(86400);
}

export function createMockUser(): UserEntity {
	const pastDate = mockPastDate();

	return {
		created_at: pastDate,
		deleted_at: null,
		email_verified_at: pastDate,
		operator_type: null,
		password_updated_at: pastDate,
		role: UserRoleEnum.MEMBER,
		status: UserStatusEnum.ACTIVE,
		updated_at: pastDate,
		id: 1,
		name: 'John Doe',
		email: 'johndoe@example.com',
		password: 'StrongP@ssw0rd',
		language: 'en',
	};
}

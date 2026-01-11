import type UserEntity from '@/features/user/user.entity';
import { UserRoleEnum, UserStatusEnum } from '@/features/user/user.entity';
import { mockPastDate } from '@/tests/mocks/helpers.mock';

export function userMock(): UserEntity {
	return {
		id: 1,
		name: 'John Doe',
		email: 'john.doe@example.com',
		email_verified_at: null,
		password: 'hashed_password',
		password_updated_at: mockPastDate(86400),
		language: 'en',
		status: UserStatusEnum.INACTIVE,
		role: UserRoleEnum.MEMBER,
		operator_type: null,
		created_at: mockPastDate(28800),
		updated_at: null,
		deleted_at: null,
	};
}

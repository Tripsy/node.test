import { jest } from '@jest/globals';
import { userMock } from '@/features/user/tests/user.mock';
import type UserEntity from '@/features/user/user.entity';
import { UserRoleEnum, UserStatusEnum } from '@/features/user/user.entity';
import { userPolicy } from '@/features/user/user.policy';
import userRoutes from '@/features/user/user.routes';
import { userService } from '@/features/user/user.service';
import type { UserValidator } from '@/features/user/user.validator';
import type { ValidatorDto } from '@/shared/abstracts/validator.abstract';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerStatusUpdate,
	testControllerUpdate,
} from '@/tests/jest-controller.setup';
import { mockPastDate } from '@/tests/mocks/helpers.mock';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'UserController';
const basePath = userRoutes.basePath;
const mockEntry = userMock();

testControllerCreate<UserEntity, ValidatorDto<UserValidator, 'create'>>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: userPolicy,
	service: userService,
	createData: {
		name: 'John Doe',
		email: 'john.doe@example.com',
		password: 'Secure@123',
		password_confirm: 'Secure@123',
		language: 'en',
		status: UserStatusEnum.PENDING, // optional, default anyway
		role: UserRoleEnum.MEMBER, // optional, default anyway
		operator_type: null, // correct for non-operator
	},
});

testControllerUpdate<UserEntity, ValidatorDto<UserValidator, 'update'>>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: userPolicy,
	service: userService,
	updateData: {
		name: 'Updated User',
		email: 'updated.user@example.com',
		language: 'en',
	},
});

testControllerRead<UserEntity>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: userPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	basePath: basePath,
	policy: userPolicy,
	service: userService,
});

testControllerRestoreSingle({
	controller: controller,
	basePath: basePath,
	policy: userPolicy,
	service: userService,
});

testControllerFind<UserEntity, ValidatorDto<UserValidator, 'find'>>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: userPolicy,
	service: userService,
	filterData: {
		filter: {
			term: 'test',
			status: UserStatusEnum.ACTIVE,
			role: UserRoleEnum.MEMBER,
			create_date_start: mockPastDate(14400),
			create_date_end: mockPastDate(7200),
			is_deleted: true,
		},
	},
});

testControllerStatusUpdate<UserEntity>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: userPolicy,
	service: userService,
	newStatus: 'active',
});

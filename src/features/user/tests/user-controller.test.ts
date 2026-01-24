import { jest } from '@jest/globals';
import {
    getUserEntityMock,
    userInputPayloads,
} from '@/features/user/tests/user.mock';
import type UserEntity from '@/features/user/user.entity';
import { userPolicy } from '@/features/user/user.policy';
import userRoutes from '@/features/user/user.routes';
import { userService } from '@/features/user/user.service';
import type {
	OrderByEnum,
	UserValidator,
} from '@/features/user/user.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerStatusUpdate,
	testControllerUpdate,
} from '@/tests/jest-controller.setup';
import { validatorPayload } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'UserController';
const basePath = userRoutes.basePath;

testControllerCreate<UserEntity, UserValidator>({
	controller: controller,
	basePath: basePath,
	entityMock: getUserEntityMock(),
	policy: userPolicy,
	service: userService,
	createData: validatorPayload(userInputPayloads, 'create'),
});

testControllerUpdate<UserEntity, UserValidator>({
	controller: controller,
	basePath: basePath,
	entityMock: getUserEntityMock(),
	policy: userPolicy,
	service: userService,
	updateData: validatorPayload(userInputPayloads, 'update'),
});

testControllerRead<UserEntity>({
	controller: controller,
	basePath: basePath,
	entityMock: getUserEntityMock(),
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

testControllerFind<UserEntity, UserValidator, OrderByEnum>({
	controller: controller,
	basePath: basePath,
	entityMock: getUserEntityMock(),
	policy: userPolicy,
	service: userService,
	findData: validatorPayload(userInputPayloads, 'find'),
});

testControllerStatusUpdate<UserEntity>({
	controller: controller,
	basePath: basePath,
	entityMock: getUserEntityMock(),
	policy: userPolicy,
	service: userService,
	newStatus: 'active',
});

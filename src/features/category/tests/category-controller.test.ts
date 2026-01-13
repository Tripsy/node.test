import { jest } from '@jest/globals';
import type CategoryEntity from '@/features/category/category.entity';
import { categoryPolicy } from '@/features/category/category.policy';
import categoryRoutes from '@/features/category/category.routes';
import { categoryService } from '@/features/category/category.service';
import type {
	CategoryValidator,
	OrderByEnum,
} from '@/features/category/category.validator';
import {
	categoryEntityMock,
	categoryPayloads,
} from '@/features/category/tests/category.mock';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerStatusUpdate,
	testControllerUpdateWithContent,
} from '@/tests/jest-controller.setup';
import { validatorPayload } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'CategoryController';
const basePath = categoryRoutes.basePath;

testControllerCreate<CategoryEntity, CategoryValidator>({
	controller: controller,
	basePath: basePath,
	entityMock: categoryEntityMock,
	policy: categoryPolicy,
	service: categoryService,
	createData: validatorPayload(categoryPayloads, 'create'),
});

testControllerUpdateWithContent<CategoryEntity, CategoryValidator>({
	controller: controller,
	basePath: basePath,
	entityMock: categoryEntityMock,
	policy: categoryPolicy,
	service: categoryService,
	updateData: validatorPayload(categoryPayloads, 'update'),
});

testControllerRead<CategoryEntity>({
	controller: controller,
	basePath: basePath,
	entityMock: categoryEntityMock,
	policy: categoryPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	basePath: basePath,
	policy: categoryPolicy,
	service: categoryService,
});

testControllerRestoreSingle({
	controller: controller,
	basePath: basePath,
	policy: categoryPolicy,
	service: categoryService,
});

testControllerFind<CategoryEntity, CategoryValidator, OrderByEnum>({
	controller: controller,
	basePath: basePath,
	entityMock: categoryEntityMock,
	policy: categoryPolicy,
	service: categoryService,
	findData: validatorPayload(categoryPayloads, 'find'),
});

testControllerStatusUpdate<CategoryEntity>({
	controller: controller,
	basePath: basePath,
	entityMock: categoryEntityMock,
	policy: categoryPolicy,
	service: categoryService,
	newStatus: 'active',
});

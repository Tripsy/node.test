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
    categoryInputPayloads, getCategoryEntityMock,
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
	entityMock: getCategoryEntityMock(),
	policy: categoryPolicy,
	service: categoryService,
	createData: validatorPayload(categoryInputPayloads, 'create'),
});

testControllerUpdateWithContent<CategoryEntity, CategoryValidator>({
	controller: controller,
	basePath: basePath,
	entityMock: getCategoryEntityMock(),
	policy: categoryPolicy,
	service: categoryService,
	updateData: validatorPayload(categoryInputPayloads, 'update'),
});

testControllerRead<CategoryEntity>({
	controller: controller,
	basePath: basePath,
	entityMock: getCategoryEntityMock(),
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
	entityMock: getCategoryEntityMock(),
	policy: categoryPolicy,
	service: categoryService,
	findData: validatorPayload(categoryInputPayloads, 'find'),
});

testControllerStatusUpdate<CategoryEntity>({
	controller: controller,
	basePath: basePath,
	entityMock: getCategoryEntityMock(),
	policy: categoryPolicy,
	service: categoryService,
	newStatus: 'active',
});

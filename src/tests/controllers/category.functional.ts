import { jest } from '@jest/globals';
import '../jest-controller.setup';
import type CategoryEntity from '@/features/category/category.entity';
import {
	CategoryStatusEnum,
	CategoryTypeEnum,
} from '@/features/category/category.entity';
import { categoryPolicy } from '@/features/category/category.policy';
import categoryRoutes from '@/features/category/category.routes';
import { categoryService } from '@/features/category/category.service';
import type { CategoryValidator } from '@/features/category/category.validator';
import type { ValidatorDto } from '@/lib/helpers';
import {
	entityDataMock,
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerStatusUpdate,
	testControllerUpdateWithContent,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'CategoryController';
const basePath = categoryRoutes.basePath;
const mockEntry = entityDataMock<CategoryEntity>('category');

testControllerCreate<CategoryEntity, ValidatorDto<CategoryValidator, 'create'>>(
	{
		controller: controller,
		basePath: basePath,
		mockEntry: mockEntry,
		policy: categoryPolicy,
		service: categoryService,
		createData: {
			type: CategoryTypeEnum.ARTICLE,
			parent_id: 1,
			content: [
				{
					language: 'en',
					label: 'Technology',
					slug: 'Technology ',
					meta: {
						title: 'Technology Articles',
						description: 'All technology related content',
					},
					description: 'Tech related articles and news',
				},
				{
					language: 'fr',
					label: 'Technologies',
					slug: 'technologies',
					meta: {
						title: 'Articles Technologies',
						description: 'Contenu lié à la technologie',
					},
				},
			],
		},
	},
);

testControllerUpdateWithContent<
	CategoryEntity,
	ValidatorDto<CategoryValidator, 'update'>
>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: categoryPolicy,
	service: categoryService,
	updateData: {
		parent_id: 3,
		content: [
			{
				language: 'en',
				label: 'Science',
				slug: 'science',
				meta: {
					title: 'Science',
					description: 'Scientific content',
				},
			},
		],
	},
});

testControllerRead<CategoryEntity>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
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

testControllerFind<CategoryEntity, ValidatorDto<CategoryValidator, 'find'>>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: categoryPolicy,
	service: categoryService,
	filterData: {
		filter: {
			language: 'en',
			type: CategoryTypeEnum.ARTICLE,
			status: CategoryStatusEnum.ACTIVE,
			term: 'tech',
			is_deleted: false,
		},
	},
});

testControllerStatusUpdate<CategoryEntity>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: categoryPolicy,
	service: categoryService,
	newStatus: 'active',
});

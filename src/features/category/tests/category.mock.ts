import type CategoryEntity from '@/features/category/category.entity';
import {
	CategoryStatusEnum,
	CategoryTypeEnum,
} from '@/features/category/category.entity';
import { mockPastDate } from '@/tests/mocks/helpers.mock';

export function categoryMock(): CategoryEntity {
	return {
		children: [],
		created_at: mockPastDate(86400),
		deleted_at: null,
		details: undefined,
		parent: null,
		sort_order: 0,
		status: CategoryStatusEnum.ACTIVE,
		type: CategoryTypeEnum.ARTICLE,
		updated_at: null,
		id: 1,
	};
}

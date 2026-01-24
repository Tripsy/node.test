import type CategoryEntity from '@/features/category/category.entity';
import {
	CategoryStatusEnum,
	CategoryTypeEnum,
} from '@/features/category/category.entity';
import type {
	CategoryValidator,
	OrderByEnum,
} from '@/features/category/category.validator';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { findQueryMock } from '@/tests/jest-controller.setup';
import { defineValidatorPayloads } from '@/tests/jest-validator.setup';
import { mockPastDate } from '@/tests/mocks/helpers.mock';

export function getCategoryEntityMock(): CategoryEntity {
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

export const categoryInputPayloads = defineValidatorPayloads<
	CategoryValidator,
	'create' | 'update' | 'read' | 'find' | 'statusUpdate'
>({
	create: {
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
	read: {
		with_ancestors: false,
		with_children: false,
	},
	update: {
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
	find: findQueryMock<CategoryValidator, OrderByEnum>({
		direction: OrderDirectionEnum.DESC,
		page: 4,
		filter: {
			language: 'en',
			type: CategoryTypeEnum.ARTICLE,
			status: CategoryStatusEnum.ACTIVE,
			term: 'tech',
			is_deleted: false,
		},
	}),
	statusUpdate: {
		force: false,
	},
});

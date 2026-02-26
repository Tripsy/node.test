import type BrandEntity from '@/features/brand/brand.entity';
import { BrandStatusEnum, BrandTypeEnum } from '@/features/brand/brand.entity';
import {
	type BrandValidator,
	OrderByEnum,
} from '@/features/brand/brand.validator';
import { createPastDate } from '@/helpers';
import { createValidatorPayloads } from '@/helpers/mock.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getBrandEntityMock(): BrandEntity {
	return {
		id: 1,
		name: 'Pepsi',
		slug: 'pepsi',
		type: BrandTypeEnum.PRODUCT,
		status: BrandStatusEnum.ACTIVE,
		sort_order: 0,
		details: null,
		created_at: createPastDate(86400),
		updated_at: null,
		deleted_at: null,
		contents: [],
	};
}

export const brandInputPayloads = createValidatorPayloads<
	BrandValidator,
	'create' | 'update' | 'find' | 'orderUpdate'
>({
	create: {
		name: 'Pepsi',
		slug: 'pepsi',
		type: BrandTypeEnum.PRODUCT,
		content: [
			{
				language: 'en',
				description: 'Juicy juice',
				meta: {
					title: 'Pepsi juice',
					description: 'Is all about Pepsi',
				},
			},
		],
	},
	update: {
		name: 'Pepsi',
		slug: 'pepsi',
		type: BrandTypeEnum.PRODUCT,
		content: [
			{
				language: 'en',
				description: 'Juicy juice',
				meta: {
					title: 'Pepsi juice',
					description: 'Is all about Pepsi',
				},
			},
		],
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'pepsi',
			type: BrandTypeEnum.PRODUCT,
			status: BrandStatusEnum.ACTIVE,
			language: 'en',
			is_deleted: false,
		},
	},
	orderUpdate: {
		positions: [1, 2],
	},
});

export const brandOutputPayloads = createValidatorPayloads<
	BrandValidator,
	'create' | 'update' | 'find'
>({
	create: {
		name: 'Pepsi',
		slug: 'pepsi',
		type: BrandTypeEnum.PRODUCT,
		content: [
			{
				language: 'en',
				description: 'Juicy juice',
				meta: {
					title: 'Pepsi juice',
					description: 'Is all about Pepsi',
				},
			},
		],
	},
	update: {
		name: 'Pepsi',
		slug: 'pepsi',
		type: BrandTypeEnum.PRODUCT,
		content: [
			{
				language: 'en',
				description: 'Juicy juice',
				meta: {
					title: 'Pepsi juice',
					description: 'Is all about Pepsi',
				},
			},
		],
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'pepsi',
			type: BrandTypeEnum.PRODUCT,
			status: BrandStatusEnum.ACTIVE,
			language: 'en',
			is_deleted: false,
		},
	},
});

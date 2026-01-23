import type DiscountEntity from '@/features/discount/discount.entity';
import {
	DiscountReasonEnum,
	DiscountScopeEnum,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';
import {
	type DiscountValidator,
	OrderByEnum,
} from '@/features/discount/discount.validator';
import { formatDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { findQueryMock } from '@/tests/jest-controller.setup';
import { defineValidatorPayloads } from '@/tests/jest-validator.setup';
import { mockFutureDate, mockPastDate } from '@/tests/mocks/helpers.mock';

export const discountEntityMock: DiscountEntity = {
	created_at: mockPastDate(86400),
	deleted_at: null,
	end_at: mockFutureDate(86400),
	id: 1,
	label: '',
	notes: null,
	reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
	reference: '#abc',
	scope: DiscountScopeEnum.CATEGORY,
	start_at: mockPastDate(86400),
	type: DiscountTypeEnum.PERCENT,
	updated_at: null,
	value: 10,
};

export const discountInputPayloads = defineValidatorPayloads<
	DiscountValidator,
	'create' | 'update' | 'find'
>({
	create: {
		label: 'Black Friday Discount',
		scope: DiscountScopeEnum.ORDER,
		reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
		reference: 'BF-2025',
		type: DiscountTypeEnum.AMOUNT,
		value: 25,
		start_at: formatDate(mockFutureDate(14400)),
		end_at: formatDate(mockFutureDate(28800)),
		notes: 'Applied to all orders during January',
	},
	update: {
		label: 'Black Friday Discount',
		scope: DiscountScopeEnum.ORDER,
		reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
		reference: 'BF-2025',
		type: DiscountTypeEnum.AMOUNT,
		value: 25,
		start_at: formatDate(mockFutureDate(14400)),
		end_at: formatDate(mockFutureDate(28800)),
		notes: 'Applied to all orders during January',
	},
	find: findQueryMock<DiscountValidator, OrderByEnum>({
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		page: 4,
		filter: {
			term: 'test',
			scope: DiscountScopeEnum.CATEGORY,
			reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
			type: DiscountTypeEnum.PERCENT,
			reference: 'test',
			start_at_start: formatDate(mockPastDate(14400)),
			start_at_end: formatDate(mockPastDate(7200)),
			is_deleted: true,
		},
	}),
});

export const discountOutputPayloads = defineValidatorPayloads<
	DiscountValidator,
	'find',
	'output'
>({
	find: findQueryMock<DiscountValidator, OrderByEnum, 'output'>({
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		page: 4,
		filter: {
			id: 1,
			term: 'test',
			scope: DiscountScopeEnum.CATEGORY,
			reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
			type: DiscountTypeEnum.PERCENT,
			reference: 'test',
			start_at_start: mockPastDate(14400),
			start_at_end: mockPastDate(7200),
			is_deleted: true,
		},
	}),
});

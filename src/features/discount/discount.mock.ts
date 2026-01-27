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
import { createFutureDate, createPastDate, formatDate } from '@/helpers';
import { defineValidatorPayloads, findQueryMock } from '@/helpers/mock.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getDiscountEntityMock(): DiscountEntity {
	return {
		created_at: createPastDate(86400),
		deleted_at: null,
		end_at: createFutureDate(86400),
		id: 1,
		label: '',
		notes: null,
		reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
		reference: '#abc',
		scope: DiscountScopeEnum.CATEGORY,
		start_at: createPastDate(86400),
		type: DiscountTypeEnum.PERCENT,
		updated_at: null,
		value: 10,
	};
}

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
		start_at: formatDate(createFutureDate(14400)),
		end_at: formatDate(createFutureDate(28800)),
		notes: 'Applied to all orders during January',
	},
	update: {
		label: 'Black Friday Discount',
		scope: DiscountScopeEnum.ORDER,
		reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
		reference: 'BF-2025',
		type: DiscountTypeEnum.AMOUNT,
		value: 25,
		start_at: formatDate(createFutureDate(14400)),
		end_at: formatDate(createFutureDate(28800)),
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
			start_at_start: formatDate(createPastDate(14400)),
			start_at_end: formatDate(createPastDate(7200)),
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
			start_at_start: createPastDate(14400),
			start_at_end: createPastDate(7200),
			is_deleted: true,
		},
	}),
});

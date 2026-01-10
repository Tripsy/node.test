import type DiscountEntity from '@/features/discount/discount.entity';
import {
	DiscountReasonEnum,
	DiscountScopeEnum,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';
import { mockFutureDate, mockPastDate } from '@/tests/mocks/helpers.mock';

export function discountMock(): DiscountEntity {
	return {
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
}

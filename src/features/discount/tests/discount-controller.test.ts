import { jest } from '@jest/globals';
import type DiscountEntity from '@/features/discount/discount.entity';
import {
	DiscountReasonEnum,
	DiscountScopeEnum,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';
import { discountPolicy } from '@/features/discount/discount.policy';
import discountRoutes from '@/features/discount/discount.routes';
import { discountService } from '@/features/discount/discount.service';
import type { DiscountValidator } from '@/features/discount/discount.validator';
import { discountMock } from '@/features/discount/tests/discount.mock';
import type { ValidatorDto } from '@/lib/helpers';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerUpdate,
} from '@/tests/jest-controller.setup';
import { mockFutureDate, mockPastDate } from '@/tests/mocks/helpers.mock';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'DiscountController';
const basePath = discountRoutes.basePath;
const mockEntry = discountMock();

testControllerCreate<DiscountEntity, ValidatorDto<DiscountValidator, 'create'>>(
	{
		controller: controller,
		basePath: basePath,
		mockEntry: mockEntry,
		policy: discountPolicy,
		service: discountService,
		createData: {
			label: 'Black Friday Discount',
			scope: DiscountScopeEnum.ORDER,
			reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
			reference: 'BF-2025',
			type: DiscountTypeEnum.AMOUNT,
			value: 25,
			start_at: mockFutureDate(14400),
			end_at: mockFutureDate(28800),
			notes: 'Applied to all orders during January',
		},
	},
);

testControllerUpdate<DiscountEntity, ValidatorDto<DiscountValidator, 'update'>>(
	{
		controller: controller,
		basePath: basePath,
		mockEntry: mockEntry,
		policy: discountPolicy,
		service: discountService,
		updateData: {
			label: 'Black Friday Discount',
			scope: DiscountScopeEnum.ORDER,
			reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
			reference: 'BF-2025',
			type: DiscountTypeEnum.AMOUNT,
			value: 25,
			start_at: mockFutureDate(14400),
			end_at: mockFutureDate(28800),
			notes: 'Applied to all orders during January',
		},
	},
);

testControllerRead<DiscountEntity>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: discountPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	basePath: basePath,
	policy: discountPolicy,
	service: discountService,
});

testControllerRestoreSingle({
	controller: controller,
	basePath: basePath,
	policy: discountPolicy,
	service: discountService,
});

testControllerFind<DiscountEntity, ValidatorDto<DiscountValidator, 'find'>>({
	controller: controller,
	basePath: basePath,
	mockEntry: mockEntry,
	policy: discountPolicy,
	service: discountService,
	filterData: {
		filter: {
			term: 'test',
			scope: DiscountScopeEnum.CATEGORY,
			reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
			type: DiscountTypeEnum.PERCENT,
			reference: 'test',
			start_at_start: mockPastDate(14400),
			start_at_end: mockPastDate(7200),
			is_deleted: true,
		},
	},
});

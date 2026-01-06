import { jest } from '@jest/globals';
import '../jest-controller.setup';
import type DiscountEntity from '@/features/discount/discount.entity';
import {
	DiscountReasonEnum,
	DiscountScopeEnum,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';
import { discountPolicy } from '@/features/discount/discount.policy';
import discountRoutes from '@/features/discount/discount.routes';
import { discountService } from '@/features/discount/discount.service';
import type {
	DiscountValidatorCreateDto,
	DiscountValidatorFindDto,
} from '@/features/discount/discount.validator';
import { mockFutureDate, mockPastDate } from '@/tests/jest.setup';
import {
	entityDataMock,
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerUpdate,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'DiscountController';
const basePath = discountRoutes.basePath;

testControllerCreate<DiscountEntity, DiscountValidatorCreateDto>({
	controller: controller,
	basePath: basePath,
	mockEntry: entityDataMock<DiscountEntity>('discount'),
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
});

testControllerUpdate<DiscountEntity, DiscountValidatorCreateDto>({
	controller: controller,
	basePath: basePath,
	mockEntry: entityDataMock<DiscountEntity>('discount'),
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
});

testControllerRead<DiscountEntity>({
	controller: controller,
	basePath: basePath,
	mockEntry: entityDataMock<DiscountEntity>('discount'),
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

testControllerFind<DiscountEntity, DiscountValidatorFindDto>({
	controller: controller,
	basePath: basePath,
	mockEntry: entityDataMock<DiscountEntity>('discount'),
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

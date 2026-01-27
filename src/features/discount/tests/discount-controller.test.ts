import { jest } from '@jest/globals';
import type DiscountEntity from '@/features/discount/discount.entity';
import { discountPolicy } from '@/features/discount/discount.policy';
import discountRoutes from '@/features/discount/discount.routes';
import { discountService } from '@/features/discount/discount.service';
import type { DiscountValidator } from '@/features/discount/discount.validator';
import {
	discountInputPayloads,
	getDiscountEntityMock,
} from '@/features/discount/tests/discount.mock';
import {
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

testControllerCreate<DiscountEntity, DiscountValidator>({
	controller: controller,
	basePath: basePath,
	entityMock: getDiscountEntityMock(),
	policy: discountPolicy,
	service: discountService,
	createData: discountInputPayloads.get('create'),
});

testControllerUpdate<DiscountEntity, DiscountValidator>({
	controller: controller,
	basePath: basePath,
	entityMock: getDiscountEntityMock(),
	policy: discountPolicy,
	service: discountService,
	updateData: discountInputPayloads.get('update'),
});

testControllerRead<DiscountEntity>({
	controller: controller,
	basePath: basePath,
	entityMock: getDiscountEntityMock(),
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

testControllerFind<DiscountEntity, DiscountValidator>({
	controller: controller,
	basePath: basePath,
	entityMock: getDiscountEntityMock(),
	policy: discountPolicy,
	service: discountService,
	findData: discountInputPayloads.get('find'),
});

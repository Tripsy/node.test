import { jest } from '@jest/globals';
import type CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import {
	cashFlowInputPayloads,
	getCashFlowEntityMock,
} from '@/features/cash-flow/cash-flow.mock';
import { cashFlowPolicy } from '@/features/cash-flow/cash-flow.policy';
import cashFlowRoutes from '@/features/cash-flow/cash-flow.routes';
import { cashFlowService } from '@/features/cash-flow/cash-flow.service';
import type { CashFlowValidator } from '@/features/cash-flow/cash-flow.validator';
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

const controller = 'CashFlowController';
const basePath = cashFlowRoutes.basePath;

testControllerCreate<CashFlowEntity, CashFlowValidator>({
	controller: controller,
	route: basePath,
	entityMock: getCashFlowEntityMock(),
	policy: cashFlowPolicy,
	service: cashFlowService,
	createData: cashFlowInputPayloads.get('create'),
});

testControllerUpdate<CashFlowEntity, CashFlowValidator>({
	controller: controller,
	route: `${basePath}/${getCashFlowEntityMock().id}`,
	entityMock: getCashFlowEntityMock(),
	policy: cashFlowPolicy,
	service: cashFlowService,
	updateData: cashFlowInputPayloads.get('update'),
});

testControllerRead<CashFlowEntity>({
	controller: controller,
	route: `${basePath}/${getCashFlowEntityMock().id}`,
	entityMock: getCashFlowEntityMock(),
	policy: cashFlowPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getCashFlowEntityMock().id}`,
	policy: cashFlowPolicy,
	service: cashFlowService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getCashFlowEntityMock().id}/restore`,
	policy: cashFlowPolicy,
	service: cashFlowService,
});

testControllerFind<CashFlowEntity, CashFlowValidator>({
	controller: controller,
	route: basePath,
	entityMock: getCashFlowEntityMock(),
	policy: cashFlowPolicy,
	service: cashFlowService,
	findData: cashFlowInputPayloads.get('find'),
});

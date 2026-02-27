import { expect, jest } from '@jest/globals';
import type CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import {
	cashFlowOutputPayloads,
	getCashFlowEntityMock,
} from '@/features/cash-flow/cash-flow.mock';
import type { CashFlowQuery } from '@/features/cash-flow/cash-flow.repository';
import { CashFlowService } from '@/features/cash-flow/cash-flow.service';
import type { CashFlowValidator } from '@/features/cash-flow/cash-flow.validator';
import {
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
} from '@/tests/jest-service.setup';

describe('CashFlowService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockCashFlow = createMockRepository<CashFlowEntity, CashFlowQuery>();

	const serviceCashFlow = new CashFlowService(mockCashFlow.repository);

	it('should create entry', async () => {
		const entity = getCashFlowEntityMock();
		const createData = cashFlowOutputPayloads.get('create');

		jest.spyOn(serviceCashFlow, 'findByName').mockResolvedValue(null);
		mockCashFlow.repository.save.mockResolvedValue(entity);

		const result = await serviceCashFlow.create(createData);

		expect(mockCashFlow.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<CashFlowEntity>(
		serviceCashFlow,
		mockCashFlow.repository,
		getCashFlowEntityMock(),
	);

	testServiceDelete<CashFlowEntity, CashFlowQuery>(
		mockCashFlow.query,
		serviceCashFlow,
	);
	testServiceRestore<CashFlowEntity, CashFlowQuery>(
		mockCashFlow.query,
		serviceCashFlow,
	);
	testServiceFindById<CashFlowEntity, CashFlowQuery>(
		mockCashFlow.query,
		serviceCashFlow,
	);

	testServiceFindByFilter<CashFlowEntity, CashFlowQuery, CashFlowValidator>(
		mockCashFlow.query,
		serviceCashFlow,
		cashFlowOutputPayloads.get('find'),
	);
});

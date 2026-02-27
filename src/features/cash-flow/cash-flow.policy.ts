import CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

class CashFlowPolicy extends PolicyAbstract {
	constructor() {
		const entity = CashFlowEntity.NAME;

		super(entity);
	}
}

export const cashFlowPolicy = new CashFlowPolicy();

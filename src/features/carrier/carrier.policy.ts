import CarrierEntity from '@/features/carrier/carrier.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';

class CarrierPolicy extends PolicyAbstract {
	constructor() {
		const entity = CarrierEntity.NAME;

		super(entity);
	}
}

export const carrierPolicy = new CarrierPolicy();

import CarrierEntity from '@/features/carrier/carrier.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class CarrierPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = CarrierEntity.NAME;

		super(auth, entity);
	}
}

export default CarrierPolicy;

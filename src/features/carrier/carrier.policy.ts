import { CarrierQuery } from '@/features/carrier/carrier.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class CarrierPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = CarrierQuery.entityAlias;

		super(auth, entity);
	}
}

export default CarrierPolicy;

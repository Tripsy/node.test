import PolicyAbstract from '@/abstracts/policy.abstract';
import { CarrierQuery } from '@/features/carrier/carrier.repository';
import type { AuthContext } from '@/types/express';

class CarrierPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = CarrierQuery.entityAlias;

		super(auth, entity);
	}
}

export default CarrierPolicy;

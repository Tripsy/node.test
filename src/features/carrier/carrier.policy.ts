import type { Request } from 'express';
import PolicyAbstract from '@/abstracts/policy.abstract';
import { CarrierQuery } from '@/features/carrier/carrier.repository';

class CarrierPolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = CarrierQuery.entityAlias;

		super(req, entity);
	}
}

export default CarrierPolicy;

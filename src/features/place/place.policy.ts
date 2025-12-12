import type { Request } from 'express';
import PolicyAbstract from '@/abstracts/policy.abstract';
import { PlaceQuery } from '@/features/place/place.repository';

class PlacePolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = PlaceQuery.entityAlias;

		super(req, entity);
	}
}

export default PlacePolicy;

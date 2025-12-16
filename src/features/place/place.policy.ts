import PolicyAbstract from '@/abstracts/policy.abstract';
import { PlaceQuery } from '@/features/place/place.repository';
import type { AuthContext } from '@/types/express';

class PlacePolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = PlaceQuery.entityAlias;

		super(auth, entity);
	}
}

export default PlacePolicy;

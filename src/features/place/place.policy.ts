import { PlaceQuery } from '@/features/place/place.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class PlacePolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = PlaceQuery.entityAlias;

		super(auth, entity);
	}
}

export default PlacePolicy;

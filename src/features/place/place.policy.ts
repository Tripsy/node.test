import PlaceEntity from '@/features/place/place.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class PlacePolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = PlaceEntity.NAME;

		super(auth, entity);
	}
}

export default PlacePolicy;

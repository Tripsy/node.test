import PlaceEntity from '@/features/place/place.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';

class PlacePolicy extends PolicyAbstract {
	constructor() {
		const entity = PlaceEntity.NAME;

		super(entity);
	}
}

export const placePolicy = new PlacePolicy();

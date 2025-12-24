import { EventSubscriber } from 'typeorm';
import PlaceEntity from '@/features/place/place.entity';
import SubscriberAbstract from '@/lib/abstracts/subscriber.abstract';

@EventSubscriber()
export class PlaceSubscriber extends SubscriberAbstract<PlaceEntity> {
	protected readonly Entity = PlaceEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			beforeRemove: true,
			afterSoftRemove: true,
		};
	}
}

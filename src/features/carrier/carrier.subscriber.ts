import { EventSubscriber } from 'typeorm';
import CarrierEntity from '@/features/carrier/carrier.entity';
import SubscriberAbstract from '@/lib/abstracts/subscriber.abstract';

@EventSubscriber()
export class CarrierSubscriber extends SubscriberAbstract<CarrierEntity> {
	protected readonly Entity = CarrierEntity;

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

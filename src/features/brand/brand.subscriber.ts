import { EventSubscriber } from 'typeorm';
import BrandEntity from '@/features/brand/brand.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class BrandSubscriber extends SubscriberAbstract<BrandEntity> {
	protected readonly Entity = BrandEntity;

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

import { EventSubscriber } from 'typeorm';
import DiscountEntity from '@/features/discount/discount.entity';
import SubscriberAbstract from '@/lib/abstracts/subscriber.abstract';

@EventSubscriber()
export class DiscountSubscriber extends SubscriberAbstract<DiscountEntity> {
	protected readonly Entity = DiscountEntity;

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

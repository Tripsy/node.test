import { EventSubscriber } from 'typeorm';
import ProductEntity from '@/features/product/product.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class ProductSubscriber extends SubscriberAbstract<ProductEntity> {
	protected readonly Entity = ProductEntity;

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

import { EventSubscriber } from 'typeorm';
import ExchangeRateEntity from '@/features/exchange-rate/exchange-rate.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class ExchangeRateSubscriber extends SubscriberAbstract<ExchangeRateEntity> {
	protected readonly Entity = ExchangeRateEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			beforeRemove: true,
		};
	}
}

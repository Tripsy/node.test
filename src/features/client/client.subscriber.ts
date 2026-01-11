import { EventSubscriber } from 'typeorm';
import ClientEntity from '@/features/client/client.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class ClientSubscriber extends SubscriberAbstract<ClientEntity> {
	protected readonly Entity = ClientEntity;

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

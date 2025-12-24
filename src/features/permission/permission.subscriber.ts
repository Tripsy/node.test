import { EventSubscriber } from 'typeorm';
import PermissionEntity from '@/features/permission/permission.entity';
import SubscriberAbstract from '@/lib/abstracts/subscriber.abstract';

@EventSubscriber()
export class PermissionSubscriber extends SubscriberAbstract<PermissionEntity> {
	protected readonly Entity = PermissionEntity;

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

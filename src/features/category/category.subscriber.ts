import { EventSubscriber, type UpdateEvent } from 'typeorm';
import CategoryEntity from '@/features/category/category.entity';
import { LogHistoryAction } from '@/features/log-history/log-history.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class CategorySubscriber extends SubscriberAbstract<CategoryEntity> {
	protected readonly Entity = CategoryEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			beforeRemove: true,
			afterSoftRemove: true,
		};
	}

	async afterUpdate(event: UpdateEvent<CategoryEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);

		this.logHistory(
			id,
			this.isRestore(event)
				? LogHistoryAction.RESTORED
				: LogHistoryAction.UPDATED,
		);

		// Check if the status was updated
		if (
			event.entity?.status &&
			event.databaseEntity?.status &&
			event.entity.status !== event.databaseEntity.status
		) {
			this.logHistory(id, LogHistoryAction.STATUS, {
				oldStatus: event.databaseEntity.status,
				newStatus: event.entity.status,
			});
		}
	}
}

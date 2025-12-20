import {
	type EntitySubscriberInterface,
	EventSubscriber,
	type InsertEvent,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import DiscountEntity from '@/features/discount/discount.entity';
import { DiscountQuery } from '@/features/discount/discount.repository';
import {
	cacheClean,
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/lib/helpers';

@EventSubscriber()
export class DiscountSubscriber
	implements EntitySubscriberInterface<DiscountEntity>
{
	/**
	 * Specify which entity this subscriber is for.
	 */
	listenTo() {
		return DiscountEntity;
	}

	/**
	 * When entry is removed from the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<DiscountEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(DiscountQuery.entityAlias, id, false);
	}

	/**
	 * When the entry is marked as deleted in the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<DiscountEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(DiscountQuery.entityAlias, id, true);
	}

	async afterInsert(event: InsertEvent<DiscountEntity>) {
		logHistory(DiscountQuery.entityAlias, event.entity.id, 'created');
	}

	async afterUpdate(event: UpdateEvent<DiscountEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		if (isRestore(event)) {
			restoreOperation(DiscountQuery.entityAlias, id);

			return;
		}

		cacheClean(DiscountQuery.entityAlias, id);
		logHistory(DiscountQuery.entityAlias, id, 'updated');
	}
}

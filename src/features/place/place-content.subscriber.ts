import {
	type EntitySubscriberInterface,
	EventSubscriber,
	type InsertEvent,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import PlaceContentEntity from '@/features/place/place-content.entity';
import { PlaceContentQuery } from '@/features/place/place-content.repository';
import {
	cacheClean,
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/helpers';

@EventSubscriber()
export class PlaceContentSubscriber
	implements EntitySubscriberInterface<PlaceContentEntity>
{
	/**
	 * Specify which entity this subscriber is for.
	 */
	listenTo() {
		return PlaceContentEntity;
	}

	/**
	 * When entry is removed from the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<PlaceContentEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(PlaceContentQuery.entityAlias, id, false);
	}

	/**
	 * When the entry is marked as deleted in the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<PlaceContentEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(PlaceContentQuery.entityAlias, id, true);
	}

	async afterInsert(event: InsertEvent<PlaceContentEntity>) {
		logHistory(PlaceContentQuery.entityAlias, event.entity.id, 'created');
	}

	async afterUpdate(event: UpdateEvent<PlaceContentEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		if (isRestore(event)) {
			restoreOperation(PlaceContentQuery.entityAlias, id);

			return;
		}

		cacheClean(PlaceContentQuery.entityAlias, id);
		logHistory(PlaceContentQuery.entityAlias, id, 'updated');
	}
}

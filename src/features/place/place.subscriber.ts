import {
	type EntitySubscriberInterface,
	EventSubscriber,
	type InsertEvent,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import PlaceEntity from '@/features/place/place.entity';
import { PlaceQuery } from '@/features/place/place.repository';
import {
	cacheClean,
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/lib/helpers';

@EventSubscriber()
export class PlaceSubscriber implements EntitySubscriberInterface<PlaceEntity> {
	/**
	 * Specify which entity this subscriber is for.
	 */
	listenTo() {
		return PlaceEntity;
	}

	/**
	 * When entry is removed from the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<PlaceEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(PlaceQuery.entityAlias, id, false);
	}

	/**
	 * When the entry is marked as deleted in the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<PlaceEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(PlaceQuery.entityAlias, id, true);
	}

	async afterInsert(event: InsertEvent<PlaceEntity>) {
		logHistory(PlaceQuery.entityAlias, event.entity.id, 'created');
	}

	async afterUpdate(event: UpdateEvent<PlaceEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		if (isRestore(event)) {
			restoreOperation(PlaceQuery.entityAlias, id);

			return;
		}

		cacheClean(PlaceQuery.entityAlias, id);
		logHistory(PlaceQuery.entityAlias, id, 'updated');
	}
}

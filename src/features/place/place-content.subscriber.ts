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
	getAuthIdFromContext,
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
	 * When entry is removed from the database
	 * `event.entity` will be undefined if entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<PlaceContentEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(
			{
				entity: PlaceContentQuery.entityAlias,
				id: id,
				auth_id: getAuthIdFromContext(event.entity?.contextData),
			},
			false,
		);
	}

	/**
	 * When entry is marked as deleted in the database
	 * `event.entity` will be undefined if entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<PlaceContentEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(
			{
				entity: PlaceContentQuery.entityAlias,
				id: id,
				auth_id: getAuthIdFromContext(event.entity?.contextData),
			},
			true,
		);
	}

	async afterInsert(event: InsertEvent<PlaceContentEntity>) {
		logHistory(PlaceContentQuery.entityAlias, 'created', {
			id: event.entity.id.toString(),
			auth_id: getAuthIdFromContext(event.entity?.contextData).toString(),
		});
	}

	async afterUpdate(event: UpdateEvent<PlaceContentEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;
		const auth_id: number = getAuthIdFromContext(event.entity?.contextData);

		// When entry is restored
		if (isRestore(event)) {
			restoreOperation({
				entity: PlaceContentQuery.entityAlias,
				id: id,
				auth_id: auth_id,
			});

			return;
		}

		// When entry is updated
		cacheClean(PlaceContentQuery.entityAlias, id);

		logHistory(PlaceContentQuery.entityAlias, 'updated', {
			id: id.toString(),
			auth_id: auth_id.toString(),
		});
	}
}

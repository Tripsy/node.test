import {
	type EntitySubscriberInterface,
	EventSubscriber,
	type InsertEvent,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import CarrierEntity from '@/features/carrier/carrier.entity';
import { CarrierQuery } from '@/features/carrier/carrier.repository';
import {
	cacheClean,
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/lib/helpers';

@EventSubscriber()
export class CarrierSubscriber
	implements EntitySubscriberInterface<CarrierEntity>
{
	/**
	 * Specify which entity this subscriber is for.
	 */
	listenTo() {
		return CarrierEntity;
	}

	/**
	 * When entry is removed from the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<CarrierEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(CarrierQuery.entityAlias, id, false);
	}

	/**
	 * When the entry is marked as deleted in the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<CarrierEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(CarrierQuery.entityAlias, id, true);
	}

	async afterInsert(event: InsertEvent<CarrierEntity>) {
		logHistory(CarrierQuery.entityAlias, event.entity.id, 'created');
	}

	async afterUpdate(event: UpdateEvent<CarrierEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		if (isRestore(event)) {
			restoreOperation(CarrierQuery.entityAlias, id);

			return;
		}

		cacheClean(CarrierQuery.entityAlias, id);
		logHistory(CarrierQuery.entityAlias, id, 'updated');
	}
}

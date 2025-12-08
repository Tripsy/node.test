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
	getAuthIdFromContext,
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/helpers';

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
	 * When entry is removed from the database
	 * `event.entity` will be undefined if entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<CarrierEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(
			{
				entity: CarrierQuery.entityAlias,
				id: id,
				auth_id: getAuthIdFromContext(event.entity?.contextData),
			},
			false,
		);

		cacheClean(CarrierQuery.entityAlias, id);
	}

	/**
	 * When entry is marked as deleted in the database
	 * `event.entity` will be undefined if entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<CarrierEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(
			{
				entity: CarrierQuery.entityAlias,
				id: id,
				auth_id: getAuthIdFromContext(event.entity?.contextData),
			},
			true,
		);

		cacheClean(CarrierQuery.entityAlias, id);
	}

	async afterInsert(event: InsertEvent<CarrierEntity>) {
		logHistory(CarrierQuery.entityAlias, 'created', {
			id: event.entity.id.toString(),
			auth_id: getAuthIdFromContext(event.entity?.contextData).toString(),
		});
	}

	async afterUpdate(event: UpdateEvent<CarrierEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;
		const auth_id: number = getAuthIdFromContext(event.entity?.contextData);

		// When entry is restored
		if (isRestore(event)) {
			restoreOperation({
				entity: CarrierQuery.entityAlias,
				id: id,
				auth_id: auth_id,
			});

			return;
		}

		// When entry is updated
		cacheClean(CarrierQuery.entityAlias, id);

		logHistory(CarrierQuery.entityAlias, 'updated', {
			id: id.toString(),
			auth_id: auth_id.toString(),
		});
	}
}

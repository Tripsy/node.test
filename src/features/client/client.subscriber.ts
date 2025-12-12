import {
	type EntitySubscriberInterface,
	EventSubscriber,
	type InsertEvent,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import ClientEntity from '@/features/client/client.entity';
import { ClientQuery } from '@/features/client/client.repository';
import {
	cacheClean,
	getAuthIdFromContext,
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/helpers';

@EventSubscriber()
export class ClientSubscriber
	implements EntitySubscriberInterface<ClientEntity>
{
	/**
	 * Specify which entity this subscriber is for.
	 */
	listenTo() {
		return ClientEntity;
	}

	/**
	 * When entry is removed from the database
	 * `event.entity` will be undefined if entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<ClientEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(
			{
				entity: ClientQuery.entityAlias,
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
	afterSoftRemove(event: SoftRemoveEvent<ClientEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(
			{
				entity: ClientQuery.entityAlias,
				id: id,
				auth_id: getAuthIdFromContext(event.entity?.contextData),
			},
			true,
		);
	}

	async afterInsert(event: InsertEvent<ClientEntity>) {
		const id = event.entity.id;

		logHistory(ClientQuery.entityAlias, 'created', {
			id: id.toString(),
			auth_id: getAuthIdFromContext(event.entity?.contextData).toString(),
		});
	}

	async afterUpdate(event: UpdateEvent<ClientEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;
		const auth_id: number = getAuthIdFromContext(event.entity?.contextData);

		// When entry is restored
		if (isRestore(event)) {
			restoreOperation({
				entity: ClientQuery.entityAlias,
				id: id,
				auth_id: auth_id,
			});

			return;
		}

		// When entry is updated
		cacheClean(ClientQuery.entityAlias, id);

		logHistory(ClientQuery.entityAlias, 'updated', {
			id: id.toString(),
			auth_id: auth_id.toString(),
		});
	}
}

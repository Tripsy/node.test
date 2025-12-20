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
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/lib/helpers';

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
	 * When entry is removed from the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<ClientEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(ClientQuery.entityAlias, id, false);
	}

	/**
	 * When the entry is marked as deleted in the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<ClientEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(ClientQuery.entityAlias, id, true);
	}

	async afterInsert(event: InsertEvent<ClientEntity>) {
		const id = event.entity.id;

		logHistory(ClientQuery.entityAlias, id, 'created');
	}

	async afterUpdate(event: UpdateEvent<ClientEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		if (isRestore(event)) {
			restoreOperation(ClientQuery.entityAlias, id);

			return;
		}

		cacheClean(ClientQuery.entityAlias, id);
		logHistory(ClientQuery.entityAlias, id, 'updated');
	}
}

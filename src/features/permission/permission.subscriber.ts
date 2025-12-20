import {
	type EntitySubscriberInterface,
	EventSubscriber,
	type InsertEvent,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import PermissionEntity from '@/features/permission/permission.entity';
import { PermissionQuery } from '@/features/permission/permission.repository';
import {
	cacheClean,
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/lib/helpers';

@EventSubscriber()
export class PermissionSubscriber
	implements EntitySubscriberInterface<PermissionEntity>
{
	/**
	 * Specify which entity this subscriber is for.
	 */
	listenTo() {
		return PermissionEntity;
	}

	/**
	 * When entry is removed from the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<PermissionEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(PermissionQuery.entityAlias, id, false);
	}

	/**
	 * When the entry is marked as deleted in the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<PermissionEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(PermissionQuery.entityAlias, id, true);
	}

	async afterInsert(event: InsertEvent<PermissionEntity>) {
		logHistory(PermissionQuery.entityAlias, event.entity.id, 'created');
	}

	afterUpdate(event: UpdateEvent<PermissionEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		if (isRestore(event)) {
			restoreOperation(PermissionQuery.entityAlias, id);

			return;
		}

		cacheClean(PermissionQuery.entityAlias, id);
		logHistory(PermissionQuery.entityAlias, id, 'updated');
	}
}

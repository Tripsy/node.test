import {
	type EntitySubscriberInterface,
	EventSubscriber,
	type InsertEvent,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import { UserQuery } from '@/features/user/user.repository';
import UserPermissionEntity from '@/features/user-permission/user-permission.entity';
import { UserPermissionQuery } from '@/features/user-permission/user-permission.repository';
import { cacheClean, isRestore, logHistory } from '@/lib/helpers';

@EventSubscriber()
export class UserPermissionSubscriber
	implements EntitySubscriberInterface<UserPermissionEntity>
{
	/**
	 * Specify which entity this subscriber is for.
	 */
	listenTo() {
		return UserPermissionEntity;
	}

	/**
	 * When entry is removed from the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<UserPermissionEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;
		const user_id: number =
			event.entity?.user_id || event.databaseEntity?.user_id;

		// Clean user cache
		if (user_id) {
			cacheClean(UserQuery.entityAlias, user_id);
		}

		logHistory(UserPermissionQuery.entityAlias, id, 'deleted');
	}

	/**
	 * When the entry is marked as deleted in the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<UserPermissionEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;
		const user_id: number =
			event.entity?.user_id || event.databaseEntity?.user_id;

		cacheClean(UserQuery.entityAlias, user_id);
		logHistory(UserPermissionQuery.entityAlias, id, 'removed');
	}

	async afterInsert(event: InsertEvent<UserPermissionEntity>) {
		const id = event.entity?.id;
		const user_id = event.entity?.user_id;

		// Clean user cache
		if (user_id) {
			cacheClean(UserQuery.entityAlias, user_id);
		}

		logHistory(UserPermissionQuery.entityAlias, id, 'created');
	}

	afterUpdate(event: UpdateEvent<UserPermissionEntity>) {
		if (isRestore(event)) {
			const id: number = event.entity?.id || event.databaseEntity.id;
			const user_id: number =
				event.entity?.user_id || event.databaseEntity?.user_id;

			cacheClean(UserQuery.entityAlias, user_id);
			logHistory(UserPermissionQuery.entityAlias, id, 'restored');

			return;
		}
	}
}

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
import {
	cacheClean,
	getAuthIdFromContext,
	isRestore,
	logHistory,
} from '@/helpers/subscriber.helper';

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
	 * When entry is removed from the database
	 * `event.entity` will be undefined if entity is not properly loaded via Repository
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

		logHistory(UserPermissionQuery.entityAlias, 'deleted', {
			id: id.toString(),
			auth_id: getAuthIdFromContext(event.entity?.contextData).toString(),
		});
	}

	/**
	 * When entry is marked as deleted in the database
	 * `event.entity` will be undefined if entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<UserPermissionEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;
		const user_id: number =
			event.entity?.user_id || event.databaseEntity?.user_id;

		// Clean user cache
		if (user_id) {
			cacheClean(UserQuery.entityAlias, user_id);
		}

		logHistory(UserPermissionQuery.entityAlias, 'removed', {
			id: id.toString(),
			auth_id: getAuthIdFromContext(event.entity?.contextData).toString(),
		});
	}

	async afterInsert(event: InsertEvent<UserPermissionEntity>) {
		const id = event.entity?.id;
		const user_id = event.entity?.user_id;

		// Clean user cache
		if (user_id) {
			cacheClean(UserQuery.entityAlias, user_id);
		}

		logHistory(UserPermissionQuery.entityAlias, 'created', {
			id: id.toString(),
			auth_id: getAuthIdFromContext(event.entity?.contextData).toString(),
		});
	}

	afterUpdate(event: UpdateEvent<UserPermissionEntity>) {
		// When entry is restored
		if (isRestore(event)) {
			const id: number = event.entity?.id || event.databaseEntity.id;
			const auth_id: number = getAuthIdFromContext(
				event.entity?.contextData,
			);
			const user_id: number =
				event.entity?.user_id || event.databaseEntity?.user_id;

			// Clean user cache
			if (user_id) {
				cacheClean(UserQuery.entityAlias, user_id);
			}

			logHistory(UserPermissionQuery.entityAlias, 'restored', {
				id: id.toString(),
				auth_id: auth_id.toString(),
			});

			return;
		}
	}
}

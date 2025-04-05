import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    RemoveEvent,
    SoftRemoveEvent,
    RecoverEvent, UpdateEvent
} from 'typeorm';
import UserPermissionEntity from '../entities/user-permission.entity';
import {UserPermissionQuery} from '../repositories/user-permission.repository';
import {
    cacheClean,
    getAuthIdFromContext, isRestore,
    logHistory, restoreOperation
} from '../helpers/subscriber.helper';
import {UserQuery} from '../repositories/user.repository';
import PermissionEntity from '../entities/permission.entity';
import {PermissionQuery} from '../repositories/permission.repository';

@EventSubscriber()
export class UserPermissionSubscriber implements EntitySubscriberInterface<UserPermissionEntity> {
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
    beforeRemove(event: RemoveEvent<any>) {
        const user_id: number = event.entity?.user_id || event.databaseEntity?.user_id;

        // Clean user cache
        if (user_id) {
            cacheClean(UserQuery.entityAlias, user_id);
        }

        logHistory(UserPermissionQuery.entityAlias, 'deleted', {
            id: event.entity.id.toString(),
            auth_id: getAuthIdFromContext(event.entity?.contextData).toString()
        });
    }

    /**
     * When entry is marked as deleted in the database
     * `event.entity` will be undefined if entity is not properly loaded via Repository
     *
     * @param event
     */
    afterSoftRemove(event: SoftRemoveEvent<any>) {
        const user_id: number = event.entity?.user_id || event.databaseEntity?.user_id;

        // Clean user cache
        if (user_id) {
            cacheClean(UserQuery.entityAlias, user_id);
        }

        logHistory(UserPermissionQuery.entityAlias, 'removed', {
            id: event.entity.id.toString(),
            auth_id: getAuthIdFromContext(event.entity?.contextData).toString()
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
            auth_id: getAuthIdFromContext(event.entity?.contextData).toString()
        });
    }

    afterUpdate(event: UpdateEvent<UserPermissionEntity>) {
        // When entry is restored
        if (isRestore(event)) {
            const id: number = event.entity?.id || event.databaseEntity.id;
            const auth_id: number = getAuthIdFromContext(event.entity?.contextData);
            const user_id: number = event.entity?.user_id || event.databaseEntity?.user_id;

            // Clean user cache
            if (user_id) {
                cacheClean(UserQuery.entityAlias, user_id);
            }

            logHistory(UserPermissionQuery.entityAlias, 'restored', {
                id: id.toString(),
                auth_id: auth_id.toString()
            });

            return;
        }
    }
}
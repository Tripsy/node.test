import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    SoftRemoveEvent
} from 'typeorm';
import PermissionEntity from '../entities/permission.entity';
import {PermissionQuery} from '../repositories/permission.repository';
import {
    cacheClean,
    getAuthIdFromContext, isRestore,
    logHistory,
    removeOperation,
    restoreOperation
} from '../helpers/subscriber.helper';

@EventSubscriber()
export class PermissionSubscriber implements EntitySubscriberInterface<PermissionEntity> {
    /**
     * Specify which entity this subscriber is for.
     */
    listenTo() {
        return PermissionEntity;
    }

    /**
     * When entry is removed from the database
     * `event.entity` will be undefined if entity is not properly loaded via Repository
     *
     * @param event
     */
    beforeRemove(event: RemoveEvent<any>) {
        removeOperation({
            entity: PermissionQuery.entityAlias,
            id: event.entity.id,
            auth_id: getAuthIdFromContext(event.entity?.contextData)
        }, false);
    }

    /**
     * When entry is marked as deleted in the database
     * `event.entity` will be undefined if entity is not properly loaded via Repository
     *
     * @param event
     */
    afterSoftRemove(event: SoftRemoveEvent<any>) {
        removeOperation({
            entity: PermissionQuery.entityAlias,
            id: event.entity.id,
            auth_id: getAuthIdFromContext(event.entity?.contextData)
        }, true);
    }

    async afterInsert(event: InsertEvent<PermissionEntity>) {
        const id = event.entity?.id;

        logHistory(PermissionQuery.entityAlias, 'created', {
            id: id.toString(),
            auth_id: getAuthIdFromContext(event.entity?.contextData).toString(),
        });
    }

    afterUpdate(event: UpdateEvent<PermissionEntity>) {
        const id: number = event.entity?.id || event.databaseEntity.id;
        const auth_id: number = getAuthIdFromContext(event.entity?.contextData);

        // When entry is restored
        if (isRestore(event)) {
            restoreOperation({
                entity: PermissionQuery.entityAlias,
                id: id,
                auth_id: auth_id
            });

            return;
        }

        // When entry is updated
        cacheClean(PermissionQuery.entityAlias, id);

        logHistory(PermissionQuery.entityAlias, 'updated', {
            id: id.toString(),
            auth_id: auth_id.toString(),
        });
    }
}
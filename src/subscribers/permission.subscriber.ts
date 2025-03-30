import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    SoftRemoveEvent,
    RecoverEvent
} from 'typeorm';
import PermissionEntity from '../entities/permission.entity';
import {PermissionQuery} from '../repositories/permission.repository';
import {
    cacheClean,
    getAuthIdFromContext,
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

    /**
     * This method is triggered after an entity is restored.
     */
    afterRecover(event: RecoverEvent<any>): void {
        restoreOperation({
            entity: PermissionQuery.entityAlias,
            id: event.entity.id,
            auth_id: getAuthIdFromContext(event.entity?.contextData)
        });
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

        cacheClean(PermissionQuery.entityAlias, id);

        logHistory(PermissionQuery.entityAlias, 'updated', {
            id: id.toString(),
            auth_id: getAuthIdFromContext(event.entity?.contextData).toString(),
        });
    }
}

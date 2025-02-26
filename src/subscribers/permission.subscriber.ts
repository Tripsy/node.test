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
import {cacheClean, getUserIdFromContext, removeOperation} from '../helpers/subscriber';
import {logHistory} from '../helpers/log';

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
            userId: getUserIdFromContext(event.entity?.contextData)
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
            userId: getUserIdFromContext(event.entity?.contextData)
        }, true);
    }

    async afterInsert(event: InsertEvent<PermissionEntity>) {
        const id = event.entity?.id;
        const userId: number = getUserIdFromContext(event.entity?.contextData);

        logHistory(PermissionQuery.entityAlias, 'created', {
            id: id.toString(),
            userId: userId.toString()
        });
    }

    afterUpdate(event: UpdateEvent<PermissionEntity>) {
        const id: number = event.entity?.id || event.databaseEntity.id;
        const userId: number = getUserIdFromContext(event.entity?.contextData);

        cacheClean(PermissionQuery.entityAlias, id);

        logHistory(PermissionQuery.entityAlias, 'updated', {
            id: id.toString(),
            userId: userId.toString()
        });
    }
}

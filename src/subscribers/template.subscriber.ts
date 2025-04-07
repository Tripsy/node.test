import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    SoftRemoveEvent
} from 'typeorm';
import TemplateEntity from '../entities/template.entity';
import {TemplateQuery} from '../repositories/template.repository';
import {
    cacheClean,
    getAuthIdFromContext, 
    isRestore,
    logHistory,
    removeOperation,
    restoreOperation
} from '../helpers/subscriber.helper';

@EventSubscriber()
export class TemplateSubscriber implements EntitySubscriberInterface<TemplateEntity> {
    /**
     * Specify which entity this subscriber is for.
     */
    listenTo() {
        return TemplateEntity;
    }

    /**
     * When entry is removed from the database
     * `event.entity` will be undefined if entity is not properly loaded via Repository
     *
     * @param event
     */
    beforeRemove(event: RemoveEvent<any>) {
        removeOperation({
            entity: TemplateQuery.entityAlias,
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
            entity: TemplateQuery.entityAlias,
            id: event.entity.id,
            auth_id: getAuthIdFromContext(event.entity?.contextData)
        }, true);
    }

    async afterInsert(event: InsertEvent<TemplateEntity>) {
        logHistory(TemplateQuery.entityAlias, 'created', {
            id: event.entity.id.toString(),
            auth_id: getAuthIdFromContext(event.entity?.contextData).toString()
        });
    }

    async afterUpdate(event: UpdateEvent<TemplateEntity>) {
        const id: number = event.entity?.id || event.databaseEntity.id;
        const auth_id: number = getAuthIdFromContext(event.entity?.contextData);

        // When entry is restored
        if (isRestore(event)) {
            restoreOperation({
                entity: TemplateQuery.entityAlias,
                id: id,
                auth_id: auth_id
            });

            return;
        }

        // When entry is updated
        cacheClean(TemplateQuery.entityAlias, id);

        logHistory(TemplateQuery.entityAlias, 'updated', {
            id: id.toString(),
            auth_id: auth_id.toString(),
        });
    }
}

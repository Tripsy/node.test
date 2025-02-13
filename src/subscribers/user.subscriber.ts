import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    SoftRemoveEvent
} from 'typeorm';
import UserEntity from '../entities/user.entity';
import {encryptPassword} from '../helpers/security';
import UserRepository from '../repositories/user.repository';
import {cacheClean, logHistory, removeOperation} from '../helpers/subscriber';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<UserEntity> {
    /**
     * Specify which entity this subscriber is for.
     */
    listenTo() {
        return UserEntity;
    }

    async beforeInsert(event: InsertEvent<UserEntity>) {
        // Hash password before inserting a new user.
        if (event.entity.password) {
            event.entity.password = await encryptPassword(event.entity.password);
        }
    }

    async beforeUpdate(event: UpdateEvent<UserEntity>) {
        // Hash password before updating if it has changed.
        if (event.entity?.password) {
            event.entity.password = await encryptPassword(event.entity.password);
        }
    }

    /**
     * When entry is removed from the database
     * `event.entity` will be undefined if entity is not properly loaded via Repository
     *
     * @param event
     */
    beforeRemove(event: RemoveEvent<any>) {
        removeOperation(event.entity.id, false);
    }

    /**
     * When entry is marked as deleted in the database
     * `event.entity` will be undefined if entity is not properly loaded via Repository
     *
     * @param event
     */
    afterSoftRemove(event: SoftRemoveEvent<any>) {
        removeOperation(event.entity.id, true);
    }

    afterInsert(event: InsertEvent<UserEntity>) {
        const id = event.entity?.id;

        if (id) {
            logHistory(UserRepository.entityAlias, 'created', {
                id: id.toString()
            });

            // Send welcome email, log activity, etc.
        }
    }

    afterUpdate(event: UpdateEvent<UserEntity>) {
        const id: number = event.entity?.id || event.databaseEntity.id;

        cacheClean(UserRepository.entityAlias, id);

        logHistory(UserRepository.entityAlias, 'updated', {
            id: id.toString()
        });

        // Check if status was updated
        if (event.entity?.status && event.databaseEntity?.status && event.entity.status !== event.databaseEntity.status) {
            logHistory(UserRepository.entityAlias, 'status', {
                id: id.toString(),
                oldStatus: event.databaseEntity.status,
                newStatus: event.entity.status
            });

            // Send email notification for profile changes
            // sendStatusChangeNotification(id, event.databaseEntity.status, event.entity.status); // TODO
        }
    }
}

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
import logger from '../providers/logger.provider';
import {lang} from '../config/i18n-setup.config';
import {childLogger} from '../helpers/log';
import {cacheProvider} from '../providers/cache.provider';
import UserRepository from '../repositories/user.repository';

const historyLogger = childLogger(logger, 'history');

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
        this.removeOperation(event.entity.id, false);
    }

    /**
     * When entry is marked as deleted in the database
     * `event.entity` will be undefined if entity is not properly loaded via Repository
     *
     * @param event
     */
    afterSoftRemove(event: SoftRemoveEvent<any>) {
        console.log(event.entity)
        this.removeOperation(event.entity.id, true);
    }

    afterInsert(event: InsertEvent<UserEntity>) {
        const id = event.entity?.id; // TODO check to see if this works

        if (id) {
            historyLogger.info(lang('user.history.created', {id: id.toString()}));
            // Send welcome email, log activity, etc.
        }
    }

    afterUpdate(event: UpdateEvent<UserEntity>) {
        const id = event.entity?.id || event.databaseEntity.id; // TODO check to see if this works

        void cacheProvider.delete(cacheProvider.buildKey(UserRepository.entityAlias, id.toString()));
        historyLogger.info(lang('user.history.updated', {id: id.toString()}));
        // Send email notification for profile changes
    }

    /**
     * Due to internal mechanism and how the delete operation is trigger ed,
     * the events `beforeRemove`, `afterSoftRemove` cannot be used because occasionally because the event entity is undefined
     *
     * This method can be instead and triggered on delete operations
     *
     * @param id
     * @param isSoftDelete
     */
    removeOperation(id: number, isSoftDelete: boolean = false) {
        const action = isSoftDelete ? 'deleted' : 'removed';

        void cacheProvider.delete(cacheProvider.buildKey(UserRepository.entityAlias, id.toString()));
        historyLogger.info(lang(`user.history.${action}`, {id: id.toString()}));
    }
}

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
import logger from '../services/logger.service';
import {lang} from '../config/i18n-setup.config';
import {childLogger} from '../helpers/log';
import {cacheService} from '../services/cache.service';
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
     *
     * @param event
     */
    beforeRemove(event: RemoveEvent<any>) {
        void cacheService.delete(cacheService.buildKey(UserRepository.entityAlias, event.entity.id.toString()));
        historyLogger.info(lang('user.history.removed', {id: event.entity.id.toString()}));
    }

    /**
     * When entry is marked as deleted in the database
     *
     * @param event
     */
    afterSoftRemove(event: SoftRemoveEvent<any>) {
        void cacheService.delete(cacheService.buildKey(UserRepository.entityAlias, event.entity.id.toString()));
        historyLogger.info(lang('user.history.deleted', {id: event.entity.id.toString()}));
    }

    afterInsert(event: InsertEvent<UserEntity>) {
        historyLogger.info(lang('user.history.created', {id: event.entity.id.toString()}));
        // Send welcome email, log activity, etc.
    }

    afterUpdate(event: UpdateEvent<UserEntity>) {
        const id = event.entity.id || event.databaseEntity.id;

        void cacheService.delete(cacheService.buildKey(UserRepository.entityAlias, id.toString()));
        historyLogger.info(lang('user.history.updated', {id: id.toString()}));
        // Send email notification for profile changes
    }
}

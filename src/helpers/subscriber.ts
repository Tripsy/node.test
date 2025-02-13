import logger from '../providers/logger.provider';
import {lang} from '../config/i18n-setup.config';
import {childLogger} from './log';
import {cacheProvider} from '../providers/cache.provider';
import UserRepository from "../repositories/user.repository";

export function logHistory(entity: string, action: string, replacements: Record<string, string> = {}) {
    const historyLogger = childLogger(logger, 'history');

    historyLogger.info(lang(`${entity}.history.${action}`, replacements));
}
export function cacheClean(entity: string, id: number) {
    void cacheProvider.delete(cacheProvider.buildKey(entity, id.toString()));
}

/**
 * Due to internal mechanism and how the delete operation is triggered,
 * the events `beforeRemove`, `afterSoftRemove` cannot be used because occasionally because the event entity is undefined
 *
 * This method can be used instead and triggered on delete operations
 *
 * @param id
 * @param isSoftDelete
 */
export function removeOperation(id: number, isSoftDelete: boolean = false) {
    const action = isSoftDelete ? 'deleted' : 'removed';

    cacheClean(UserRepository.entityAlias, id);

    logHistory(UserRepository.entityAlias, action, {
        id: id.toString()
    });
}
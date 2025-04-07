import {getCacheProvider} from '../providers/cache.provider';
import {EntityContextData} from '../types/entity-context-data.type';
import {Logger} from 'pino';
import logger, {childLogger} from '../providers/logger.provider';
import {lang} from '../config/i18n-setup.config';
import {UpdateEvent} from 'typeorm';
import {LogCategoryEnum} from '../enums/log-category.enum';

export function cacheClean(entity: string, id: number) {
    const cacheProvider = getCacheProvider();

    void cacheProvider.deleteByPattern(cacheProvider.buildKey(entity, id.toString()) + '*');
}

const historyLogger: Logger = childLogger(logger, LogCategoryEnum.HISTORY);

export function logHistory(entity: string, action: string, replacements: Record<string, string> = {}) {
    historyLogger.info(lang(`${entity}.history.${action}`, replacements));
}

/**
 * Due to internal mechanism and how the delete operation is triggered,
 * the events `beforeRemove`, `afterSoftRemove` cannot be used because occasionally because the event entity is undefined
 *
 * `removeOperation` can be used instead and triggered on delete operations
 */

type OperationData = {
    entity: string,
    id: number,
    auth_id: number
}

export function isRestore(event: UpdateEvent<any>): boolean {
    return event.entity !== undefined && event.entity.deleted_at === null && event.databaseEntity?.deleted_at !== null;
}

export function removeOperation(data: OperationData, isSoftDelete: boolean = false) {
    const action: string = isSoftDelete ? 'deleted' : 'removed';

    cacheClean(data.entity, data.id);

    logHistory(data.entity, action, {
        id: data.id.toString(),
        auth_id: data.auth_id?.toString()
    });
}

export function restoreOperation(data: OperationData) {
    cacheClean(data.entity, data.id);

    logHistory(data.entity, 'restored', {
        id: data.id.toString(),
        auth_id: data.auth_id.toString()
    });
}

export function getAuthIdFromContext(contextData?: EntityContextData): number {
    return Number(contextData?.auth_id) || 0;
}
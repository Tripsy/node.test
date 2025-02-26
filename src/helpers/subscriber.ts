import {cacheProvider} from '../providers/cache.provider';
import {logHistory} from './log';
import {EntityContextData} from '../types/entity-context-data.type';

export function cacheClean(entity: string, id: number) {
    void cacheProvider.delete(cacheProvider.buildKey(entity, id.toString()));
}

/**
 * Due to internal mechanism and how the delete operation is triggered,
 * the events `beforeRemove`, `afterSoftRemove` cannot be used because occasionally because the event entity is undefined
 *
 * `removeOperation` can be used instead and triggered on delete operations
 */

type RemoveOperationData = {
    entity: string,
    id: number,
    userId?: number
}

export function removeOperation(data: RemoveOperationData, isSoftDelete: boolean = false) {
    const action: string = isSoftDelete ? 'deleted' : 'removed';

    cacheClean(data.entity, data.id);

    logHistory(data.entity, action, {
        id: data.id.toString(),
        userId: data.userId?.toString() || '0'
    });
}

export function getUserIdFromContext(contextData?: EntityContextData): number {
    return Number(contextData?.user_id) || 0;
}
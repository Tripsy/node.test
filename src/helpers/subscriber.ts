import {cacheProvider} from '../providers/cache.provider';
import UserRepository from "../repositories/user.repository";
import {logHistory} from './log';

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
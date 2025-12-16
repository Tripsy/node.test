import type { Logger } from 'pino';
import type { UpdateEvent } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { requestContext } from '@/config/request.context';
import { LogDataCategoryEnum } from '@/features/log-data/log-data.entity';
import { getCacheProvider } from '@/providers/cache.provider';
import logger, { childLogger } from '@/providers/logger.provider';

export function cacheClean(entity: string, ident: number | string) {
	const identString = ident.toString();

	if (!identString) {
		return;
	}

	const cacheProvider = getCacheProvider();

	void cacheProvider.deleteByPattern(
		`${cacheProvider.buildKey(entity, identString)}*`,
	);
}

export function logHistory(
	entity: string,
	entity_id: number | number[],
	action: string,
	data: Record<string, string> = {},
) {
	const historyLogger: Logger = childLogger(
		logger,
		LogDataCategoryEnum.HISTORY,
	);
	const ctx = requestContext.getStore();

	const replacements = {
		entity,
		entity_id: Array.isArray(entity_id)
			? entity_id.join(', ')
			: entity_id.toString(),
		action,
		auth_id: ctx?.auth_id.toString() || '0',
		performed_by: ctx?.performed_by || 'unknown',
		request_id: ctx?.request_id || 'unknown',
		source: ctx?.source || 'unknown',
		...data,
	};
	// TODO: what to do when saving to DB and entity_id is number[]

	historyLogger.info(lang(`${entity}.history.${action}`, replacements));
}

/**
 * Due to internal mechanism and how the delete operation is triggered,
 * the events `beforeRemove`, `afterSoftRemove` cannot be used because occasionally because the event entity is undefined
 *
 * `removeOperation` can be used instead and triggered on delete operations
 */

export function isRestore<
	E extends {
		deleted_at: Date | null;
	},
>(event: UpdateEvent<E>): boolean {
	return (
		event.entity !== undefined &&
		event.entity.deleted_at === null &&
		event.databaseEntity.deleted_at !== null
	);
}

export function removeOperation(
	entity: string,
	entity_id: number,
	isSoftDelete: boolean = false,
) {
	const action: string = isSoftDelete ? 'deleted' : 'removed';

	cacheClean(entity, entity_id);

	logHistory(entity, entity_id, action);
}

export function restoreOperation(entity: string, entity_id: number) {
	cacheClean(entity, entity_id);

	logHistory(entity, entity_id, 'restored');
}

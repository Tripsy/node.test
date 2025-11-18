import type { Logger } from 'pino';
import type { UpdateEvent } from 'typeorm';
import type { EntityContextData } from '../abstracts/entity.abstract';
import { lang } from '../config/i18n-setup.config';
import { LogDataCategoryEnum } from '../features/log-data/log-data-category.enum';
import { getCacheProvider } from '../providers/cache.provider';
import logger, { childLogger } from '../providers/logger.provider';

export function cacheClean(entity: string, id: number) {
	const cacheProvider = getCacheProvider();

	void cacheProvider.deleteByPattern(
		`${cacheProvider.buildKey(entity, id.toString())}*`,
	);
}

const historyLogger: Logger = childLogger(logger, LogDataCategoryEnum.HISTORY);

export function logHistory(
	entity: string,
	action: string,
	replacements: Record<string, string> = {},
) {
	historyLogger.info(lang(`${entity}.history.${action}`, replacements));
}

/**
 * Due to internal mechanism and how the delete operation is triggered,
 * the events `beforeRemove`, `afterSoftRemove` cannot be used because occasionally because the event entity is undefined
 *
 * `removeOperation` can be used instead and triggered on delete operations
 */

type OperationData = {
	entity: string;
	id: number | undefined;
	auth_id: number;
};

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
	data: OperationData,
	isSoftDelete: boolean = false,
) {
	const action: string = isSoftDelete ? 'deleted' : 'removed';

	if (data.id === undefined) {
		return;
	}

	cacheClean(data.entity, data.id);

	logHistory(data.entity, action, {
		id: data.id.toString(),
		auth_id: data.auth_id?.toString(),
	});
}

export function restoreOperation(data: OperationData) {
	if (data.id === undefined) {
		return;
	}

	cacheClean(data.entity, data.id);

	logHistory(data.entity, 'restored', {
		id: data.id.toString(),
		auth_id: data.auth_id.toString(),
	});
}

export function getAuthIdFromContext(contextData?: EntityContextData): number {
	return Number(contextData?.auth_id) || 0;
}

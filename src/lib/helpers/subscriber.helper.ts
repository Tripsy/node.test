import type { UpdateEvent } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { RequestContextSource, requestContext } from '@/config/request.context';
import { cfg, type LogHistoryDestination } from '@/config/settings.config';
import { getLogHistoryRepository } from '@/features/log-history/log-history.repository';
import { getCacheProvider } from '@/lib/providers/cache.provider';
import { getHistoryLogger } from '@/lib/providers/logger.provider';

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
	const ctx = requestContext.getStore();

	switch (cfg('logging.history') as LogHistoryDestination) {
		case 'pino': {
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

			getHistoryLogger().info(
				lang(`${entity}.history.${action}`, replacements),
			);
			break;
		}
		case 'db': {
			const entity_ids = Array.isArray(entity_id)
				? entity_id
				: [entity_id];

			void getLogHistoryRepository().createLogs(
				entity,
				entity_ids,
				action,
				ctx?.auth_id || null,
				ctx?.performed_by || 'unknown',
				ctx?.request_id || 'unknown',
				ctx?.source || RequestContextSource.UNKNOWN,
				data,
			);
			break;
		}
	}
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

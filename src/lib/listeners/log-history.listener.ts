import {
	eventEmitter,
	type LogHistoryEventPayload,
} from '@/config/event.config';
import { lang } from '@/config/i18n.setup';
import { RequestContextSource, requestContext } from '@/config/request.context';
import { Configuration } from '@/config/settings.config';
import {
	LogHistoryAction,
	type LogHistoryDestination,
} from '@/features/log-history/log-history.entity';
import { getLogHistoryRepository } from '@/features/log-history/log-history.repository';
import { getHistoryLogger } from '@/lib/providers/logger.provider';

export function registerLogHistoryListener() {
	eventEmitter.on('history', async (payload: LogHistoryEventPayload) => {
		const logDestination = Configuration.get(
			'logging.history',
		) as LogHistoryDestination;

		const ctx = requestContext.getStore();

		switch (logDestination) {
			case 'pino': {
				const replacements: Record<string, string> = {
					entity: payload.entity,
					action: payload.action,
					auth_id: ctx?.auth_id.toString() || '0',
					performed_by: ctx?.performed_by || 'unknown',
					request_id: ctx?.request_id || 'unknown',
					source: ctx?.source || RequestContextSource.UNKNOWN,
					...payload.data,
				};

				if (
					[
						LogHistoryAction.DELETED,
						LogHistoryAction.REMOVED,
						LogHistoryAction.RESTORED,
					].includes(payload.action)
				) {
					replacements.entity_ids = payload.entity_ids.join(', ');
				} else {
					replacements.entity_id = payload.entity_ids[0].toString();
				}

				getHistoryLogger().info(
					lang(
						`${payload.entity}.history.${payload.action}`,
						replacements,
					),
				);
				break;
			}

			case 'db': {
				void getLogHistoryRepository().createLogs(
					payload.entity,
					payload.entity_ids,
					payload.action,
					ctx?.auth_id || null,
					ctx?.performed_by || 'unknown',
					ctx?.request_id || 'unknown',
					ctx?.source || RequestContextSource.UNKNOWN,
					payload.data,
				);

				break;
			}
		}
	});
}

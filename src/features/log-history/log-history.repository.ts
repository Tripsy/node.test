import dataSource from '@/config/data-source.config';
import type { RequestContextSource } from '@/config/request.context';
import LogHistoryEntity from '@/features/log-history/log-history.entity';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';
import { getSystemLogger } from '@/lib/providers/logger.provider';

export class LogHistoryQuery extends RepositoryAbstract<LogHistoryEntity> {
	static entityAlias: string = 'log_history';

	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<LogHistoryEntity>
		>,
	) {
		super(repository, LogHistoryQuery.entityAlias);
	}
}

export const getLogHistoryRepository = () =>
	dataSource.getRepository(LogHistoryEntity).extend({
		createQuery() {
			return new LogHistoryQuery(this);
		},

		createLogs(
			entity: string,
			entity_ids: number[],
			action: string,
			auth_id: number | null,
			performed_by: string,
			request_id: string,
			source: RequestContextSource,
			data: Record<string, unknown>,
		) {
			const recorded_at = new Date();

			getSystemLogger().info(
				`Creating log history for ${entity} ${entity_ids.join(', ')}`,
			);

			const records = entity_ids.map((entity_id) => {
				const log = new LogHistoryEntity();

				log.entity = entity;
				log.entity_id = entity_id;
				log.action = action;
				log.auth_id = auth_id;
				log.performed_by = performed_by;
				log.request_id = request_id;
				log.source = source;
				log.recorded_at = recorded_at;
				log.details = data;

				return log;
			});

			return this.save(records);
		},
	});

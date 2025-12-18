import RepositoryAbstract from '@/abstracts/repository.abstract';
import dataSource from '@/config/data-source.config';
import LogHistoryEntity, {
	type LogHistoryDetails,
} from '@/features/log-history/log-history.entity';
import { getSystemLogger } from '@/providers/logger.provider';

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
			details: LogHistoryDetails,
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

				log.auth_id = details.auth_id ?? null;
				log.performed_by = details.performed_by;
				log.request_id = details.request_id;
				log.source = details.source;
				log.recorded_at = recorded_at;
				log.details = details.data;

				return log;
			});

			return this.save(records);
		},
	});

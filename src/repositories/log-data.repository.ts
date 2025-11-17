import dataSource from '../config/data-source.config';
import LogDataEntity from '../entities/log-data.entity';
import AbstractQuery from './abstract.query';

export class LogDataQuery extends AbstractQuery<LogDataEntity> {
	static entityAlias: string = 'log_data';

	constructor(
		repository: ReturnType<typeof dataSource.getRepository<LogDataEntity>>,
	) {
		super(repository, LogDataQuery.entityAlias);
	}

	filterByTerm(term?: string): this {
		if (term) {
			this.query.andWhere(
				`(
                   ${LogDataQuery.entityAlias}.id = :id
                OR ${LogDataQuery.entityAlias}.pid = :pid
                OR ${LogDataQuery.entityAlias}.message LIKE :message    
                OR ${LogDataQuery.entityAlias}.context LIKE :context
            )`,
				{
					id: term,
					pid: term,
					message: `%${term}%`,
					context: `%${term}%`,
				},
			);
		}

		return this;
	}
}

export const LogDataRepository = dataSource
	.getRepository(LogDataEntity)
	.extend({
		createQuery() {
			return new LogDataQuery(this);
		},
	});

export default LogDataRepository;

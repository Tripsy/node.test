import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
import LogDataEntity from '@/features/log-data/log-data.entity';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';

export class LogDataQuery extends RepositoryAbstract<LogDataEntity> {
	static entityAlias: string = 'log_data';

	constructor(
		repository: ReturnType<typeof dataSource.getRepository<LogDataEntity>>,
	) {
		super(repository, LogDataQuery.entityAlias);
	}

	// Keep this as inspiration
	// filterByTerm(term?: string): this {
	// 	if (term) {
	// 		this.query.andWhere(
	// 			`(
	//                ${LogDataQuery.entityAlias}.id = :id
	//             OR ${LogDataQuery.entityAlias}.pid = :pid
	//             OR ${LogDataQuery.entityAlias}.message LIKE :message
	//             OR ${LogDataQuery.entityAlias}.context LIKE :context
	//         )`,
	// 			{
	// 				id: term,
	// 				pid: term,
	// 				message: `%${term}%`,
	// 				context: `%${term}%`,
	// 			},
	// 		);
	// 	}
	//
	// 	return this;
	// }

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (term.length > (cfg('filter.termMinLength') as number)) {
					this.filterAny([
						{
							column: 'request_id',
							value: term,
							operator: '=',
						},
						{
							column: 'pid',
							value: term,
							operator: '=',
						},
						{
							column: 'message',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'context::text',
							value: term,
							operator: 'ILIKE',
						},
					]);
				}
			}
		}

		return this;
	}
}

export const getLogDataRepository = () =>
	dataSource.getRepository(LogDataEntity).extend({
		createQuery() {
			return new LogDataQuery(this);
		},
	});

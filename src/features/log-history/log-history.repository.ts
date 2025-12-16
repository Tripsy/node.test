import RepositoryAbstract from '@/abstracts/repository.abstract';
import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
import LogHistoryEntity from '@/features/log-history/log-history.entity';

export class LogHistoryQuery extends RepositoryAbstract<LogHistoryEntity> {
	static entityAlias: string = 'log_history';

	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<LogHistoryEntity>
		>,
	) {
		super(repository, LogHistoryQuery.entityAlias);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (term.length > (cfg('filter.termMinLength') as number)) {
					this.filterAny([
						{
							column: 'label',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'content::text',
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

export const LogHistoryRepository = dataSource
	.getRepository(LogHistoryEntity)
	.extend({
		createQuery() {
			return new LogHistoryQuery(this);
		},
	});

export default LogHistoryRepository;

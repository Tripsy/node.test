import type LogDataEntity from '@/features/log-data/log-data.entity';
import { getLogDataRepository } from '@/features/log-data/log-data.repository';
import type {
	LogDataValidatorDeleteDto,
	LogDataValidatorFindDto,
} from '@/features/log-data/log-data.validator';
export class LogDataService {
	constructor(private repository: ReturnType<typeof getLogDataRepository>) {}

	public async delete(data: LogDataValidatorDeleteDto) {
		return await this.repository
			.createQuery()
			.filterBy('id', data.ids, 'IN')
			.delete(false, true, true);
	}

	public findById(id: number): Promise<LogDataEntity> {
		return this.repository
			.createQuery()
			.join('log_history.user', 'user', 'LEFT')
			.filterById(id)
			.firstOrFail();
	}

	public findByFilter(data: LogDataValidatorFindDto) {
		return this.repository
			.createQuery()
			.filterById(data.filter.id)
			.filterByRange(
				'created_at',
				data.filter.create_date_start,
				data.filter.create_date_end,
			)
			.filterBy('category', data.filter.category)
			.filterBy('level', data.filter.level)
			.filterByTerm(data.filter.term)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const logDataService = new LogDataService(getLogDataRepository());

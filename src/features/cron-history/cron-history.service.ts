import type CronHistoryEntity from '@/features/cron-history/cron-history.entity';
import { getCronHistoryRepository } from '@/features/cron-history/cron-history.repository';
import type {
	CronHistoryValidatorDeleteDto,
	CronHistoryValidatorFindDto,
} from '@/features/cron-history/cron-history.validator';
export class CronHistoryService {
	constructor(
		private repository: ReturnType<typeof getCronHistoryRepository>,
	) {}

	public async delete(data: CronHistoryValidatorDeleteDto) {
		return await this.repository
			.createQuery()
			.filterBy('id', data.ids, 'IN')
			.delete(false, true, true);
	}

	public findById(id: number): Promise<CronHistoryEntity> {
		return this.repository.createQuery().filterById(id).firstOrFail();
	}

	public findByFilter(data: CronHistoryValidatorFindDto) {
		return this.repository
			.createQuery()
			.filterById(data.filter.id)
			.filterByRange(
				'start_at',
				data.filter.start_date_start,
				data.filter.start_date_end,
			)
			.filterBy('status', data.filter.status)
			.filterByTerm(data.filter.term)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const cronHistoryService = new CronHistoryService(
	getCronHistoryRepository(),
);

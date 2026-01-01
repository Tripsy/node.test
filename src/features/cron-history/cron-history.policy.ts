import CronHistoryEntity from '@/features/cron-history/cron-history.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';

class CronHistoryPolicy extends PolicyAbstract {
	constructor() {
		const entity = CronHistoryEntity.NAME;

		super(entity);
	}
}

export const cronHistoryPolicy = new CronHistoryPolicy();

import LogHistoryEntity from '@/features/log-history/log-history.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';

class LogHistoryPolicy extends PolicyAbstract {
	constructor() {
		const entity = LogHistoryEntity.NAME;

		super(entity);
	}
}

export const logHistoryPolicy = new LogHistoryPolicy();

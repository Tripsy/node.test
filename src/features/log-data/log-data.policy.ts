import LogDataEntity from '@/features/log-data/log-data.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';

class LogDataPolicy extends PolicyAbstract {
	constructor() {
		const entity = LogDataEntity.NAME;

		super(entity);
	}
}

export const logDataPolicy = new LogDataPolicy();

import CronHistoryEntity from '@/features/cron-history/cron-history.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class CronHistoryPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = CronHistoryEntity.NAME;

		super(auth, entity);
	}
}

export default CronHistoryPolicy;

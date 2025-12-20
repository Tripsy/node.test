import { CronHistoryQuery } from '@/features/cron-history/cron-history.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class CronHistoryPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = CronHistoryQuery.entityAlias;

		super(auth, entity);
	}
}

export default CronHistoryPolicy;

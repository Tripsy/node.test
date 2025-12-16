import PolicyAbstract from '@/abstracts/policy.abstract';
import { CronHistoryQuery } from '@/features/cron-history/cron-history.repository';
import type { AuthContext } from '@/types/express';

class CronHistoryPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = CronHistoryQuery.entityAlias;

		super(auth, entity);
	}
}

export default CronHistoryPolicy;

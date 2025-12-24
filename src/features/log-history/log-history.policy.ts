import LogHistoryEntity from '@/features/log-history/log-history.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class LogHistoryPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = LogHistoryEntity.NAME;

		super(auth, entity);
	}
}

export default LogHistoryPolicy;

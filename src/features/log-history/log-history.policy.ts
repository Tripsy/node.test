import { LogHistoryQuery } from '@/features/log-history/log-history.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class LogHistoryPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = LogHistoryQuery.entityAlias;

		super(auth, entity);
	}
}

export default LogHistoryPolicy;

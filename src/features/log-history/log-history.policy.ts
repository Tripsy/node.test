import PolicyAbstract from '@/abstracts/policy.abstract';
import { LogHistoryQuery } from '@/features/log-history/log-history.repository';
import type { AuthContext } from '@/types/express';

class LogHistoryPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = LogHistoryQuery.entityAlias;

		super(auth, entity);
	}
}

export default LogHistoryPolicy;

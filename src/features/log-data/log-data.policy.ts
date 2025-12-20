import { LogDataQuery } from '@/features/log-data/log-data.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class LogDataPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = LogDataQuery.entityAlias;

		super(auth, entity);
	}
}

export default LogDataPolicy;

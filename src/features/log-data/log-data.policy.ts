import PolicyAbstract from '@/abstracts/policy.abstract';
import { LogDataQuery } from '@/features/log-data/log-data.repository';
import type { AuthContext } from '@/types/express';

class LogDataPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = LogDataQuery.entityAlias;

		super(auth, entity);
	}
}

export default LogDataPolicy;

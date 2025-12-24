import LogDataEntity from '@/features/log-data/log-data.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class LogDataPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = LogDataEntity.NAME;

		super(auth, entity);
	}
}

export default LogDataPolicy;

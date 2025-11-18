import type { Request } from 'express';
import PolicyAbstract from '@/abstracts/policy.abstract';
import { LogDataQuery } from '@/features/log-data/log-data.repository';

class LogDataPolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = LogDataQuery.entityAlias;

		super(req, entity);
	}
}

export default LogDataPolicy;

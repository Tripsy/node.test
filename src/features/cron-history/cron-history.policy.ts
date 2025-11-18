import type { Request } from 'express';
import PolicyAbstract from '../../abstracts/policy.abstract';
import { CronHistoryQuery } from './cron-history.repository';

class CronHistoryPolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = CronHistoryQuery.entityAlias;

		super(req, entity);
	}
}

export default CronHistoryPolicy;

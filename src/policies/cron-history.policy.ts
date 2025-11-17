import type { Request } from 'express';
import { CronHistoryQuery } from '../repositories/cron-history.repository';
import AbstractPolicy from './abstract.policy';

class CronHistoryPolicy extends AbstractPolicy {
	constructor(req: Request) {
		const entity = CronHistoryQuery.entityAlias;

		super(req, entity);
	}
}

export default CronHistoryPolicy;

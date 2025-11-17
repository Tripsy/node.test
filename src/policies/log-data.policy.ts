import type { Request } from 'express';
import { LogDataQuery } from '../repositories/log-data.repository';
import AbstractPolicy from './abstract.policy';

class LogDataPolicy extends AbstractPolicy {
	constructor(req: Request) {
		const entity = LogDataQuery.entityAlias;

		super(req, entity);
	}
}

export default LogDataPolicy;

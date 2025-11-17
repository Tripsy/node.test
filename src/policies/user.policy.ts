import type { Request } from 'express';
import { UserQuery } from '../repositories/user.repository';
import AbstractPolicy from './abstract.policy';

class UserPolicy extends AbstractPolicy {
	constructor(req: Request) {
		const entity = UserQuery.entityAlias;

		super(req, entity);
	}
}

export default UserPolicy;

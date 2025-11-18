import type { Request } from 'express';
import PolicyAbstract from '../../abstracts/policy.abstract';
import { UserQuery } from './user.repository';

class UserPolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = UserQuery.entityAlias;

		super(req, entity);
	}
}

export default UserPolicy;

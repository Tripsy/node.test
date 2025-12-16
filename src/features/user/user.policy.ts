import PolicyAbstract from '@/abstracts/policy.abstract';
import { UserQuery } from '@/features/user/user.repository';
import type { AuthContext } from '@/types/express';

class UserPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = UserQuery.entityAlias;

		super(auth, entity);
	}
}

export default UserPolicy;

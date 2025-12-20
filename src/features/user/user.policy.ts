import { UserQuery } from '@/features/user/user.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class UserPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = UserQuery.entityAlias;

		super(auth, entity);
	}
}

export default UserPolicy;

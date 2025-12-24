import UserEntity from '@/features/user/user.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class UserPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = UserEntity.NAME;

		super(auth, entity);
	}
}

export default UserPolicy;

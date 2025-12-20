import { PermissionQuery } from '@/features/permission/permission.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class PermissionPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = PermissionQuery.entityAlias;

		super(auth, entity);
	}
}

export default PermissionPolicy;

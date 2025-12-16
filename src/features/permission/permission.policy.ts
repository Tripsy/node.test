import PolicyAbstract from '@/abstracts/policy.abstract';
import { PermissionQuery } from '@/features/permission/permission.repository';
import type { AuthContext } from '@/types/express';

class PermissionPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = PermissionQuery.entityAlias;

		super(auth, entity);
	}
}

export default PermissionPolicy;

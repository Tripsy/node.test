import PermissionEntity from '@/features/permission/permission.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class PermissionPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = PermissionEntity.NAME;

		super(auth, entity);
	}
}

export default PermissionPolicy;

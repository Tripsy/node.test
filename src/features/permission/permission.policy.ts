import type { Request } from 'express';
import PolicyAbstract from '@/abstracts/policy.abstract';
import { PermissionQuery } from '@/features/permission/permission.repository';

class PermissionPolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = PermissionQuery.entityAlias;

		super(req, entity);
	}
}

export default PermissionPolicy;

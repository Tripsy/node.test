import type { Request } from 'express';
import { PermissionQuery } from '../repositories/permission.repository';
import AbstractPolicy from './abstract.policy';

class PermissionPolicy extends AbstractPolicy {
	constructor(req: Request) {
		const entity = PermissionQuery.entityAlias;

		super(req, entity);
	}
}

export default PermissionPolicy;

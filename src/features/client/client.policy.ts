import type { Request } from 'express';
import PolicyAbstract from '@/abstracts/policy.abstract';
import { ClientQuery } from '@/features/client/client.repository';

class ClientPolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = ClientQuery.entityAlias;

		super(req, entity);
	}
}

export default ClientPolicy;

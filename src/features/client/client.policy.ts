import PolicyAbstract from '@/abstracts/policy.abstract';
import { ClientQuery } from '@/features/client/client.repository';
import type { AuthContext } from '@/types/express';

class ClientPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = ClientQuery.entityAlias;

		super(auth, entity);
	}
}

export default ClientPolicy;

import { ClientQuery } from '@/features/client/client.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class ClientPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = ClientQuery.entityAlias;

		super(auth, entity);
	}
}

export default ClientPolicy;

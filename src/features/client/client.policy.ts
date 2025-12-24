import ClientEntity from '@/features/client/client.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class ClientPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = ClientEntity.NAME;

		super(auth, entity);
	}
}

export default ClientPolicy;

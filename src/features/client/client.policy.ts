import ClientEntity from '@/features/client/client.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';

class ClientPolicy extends PolicyAbstract {
	constructor() {
		const entity = ClientEntity.NAME;

		super(entity);
	}
}

export const clientPolicy = new ClientPolicy();

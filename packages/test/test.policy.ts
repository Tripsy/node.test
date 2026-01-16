import PolicyAbstract from '@/shared/abstracts/policy.abstract';

class TestPolicy extends PolicyAbstract {
	constructor() {
		const entity = 'account';

		super(entity);
	}
}

export const testPolicy = new TestPolicy();

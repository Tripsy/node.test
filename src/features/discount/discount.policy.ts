import PolicyAbstract from '@/abstracts/policy.abstract';
import { DiscountQuery } from '@/features/discount/discount.repository';
import type { AuthContext } from '@/types/express';

class DiscountPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = DiscountQuery.entityAlias;

		super(auth, entity);
	}
}

export default DiscountPolicy;

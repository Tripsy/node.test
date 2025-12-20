import { DiscountQuery } from '@/features/discount/discount.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class DiscountPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = DiscountQuery.entityAlias;

		super(auth, entity);
	}
}

export default DiscountPolicy;

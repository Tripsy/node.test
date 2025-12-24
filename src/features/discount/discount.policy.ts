import DiscountEntity from '@/features/discount/discount.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class DiscountPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = DiscountEntity.NAME;

		super(auth, entity);
	}
}

export default DiscountPolicy;

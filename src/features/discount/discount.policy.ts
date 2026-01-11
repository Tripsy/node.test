import DiscountEntity from '@/features/discount/discount.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

class DiscountPolicy extends PolicyAbstract {
	constructor() {
		const entity = DiscountEntity.NAME;

		super(entity);
	}
}

export const discountPolicy = new DiscountPolicy();

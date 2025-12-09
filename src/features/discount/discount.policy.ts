import type { Request } from 'express';
import PolicyAbstract from '@/abstracts/policy.abstract';
import { DiscountQuery } from '@/features/discount/discount.repository';

class DiscountPolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = DiscountQuery.entityAlias;

		super(req, entity);
	}
}

export default DiscountPolicy;

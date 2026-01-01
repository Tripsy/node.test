import CategoryEntity from '@/features/category/category.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';

class CategoryPolicy extends PolicyAbstract {
	constructor() {
		const entity = CategoryEntity.NAME;

		super(entity);
	}
}

export const categoryPolicy = new CategoryPolicy();

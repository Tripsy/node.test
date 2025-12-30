import CategoryEntity from '@/features/category/category.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class CategoryPolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = CategoryEntity.NAME;

		super(auth, entity);
	}
}

export default CategoryPolicy;

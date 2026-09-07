import ProductEntity from '@/features/product/product.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class ProductPolicy extends PolicyAbstract {
	constructor() {
		const entity = ProductEntity.NAME;

		super(entity);
	}
}

export const productPolicy = new ProductPolicy();

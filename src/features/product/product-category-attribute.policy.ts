import ProductEntity from '@/features/product/product.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

/**
 * Gated on `product` rather than on a permission of its own: a definition declares what a product
 * in a category must say about itself, so anyone who may edit the catalog may edit its schema.
 * A separate entry would be a second switch nobody remembers to grant.
 */
export class ProductCategoryAttributePolicy extends PolicyAbstract {
	constructor() {
		const entity = ProductEntity.NAME;

		super(entity);
	}
}

export const productCategoryAttributePolicy =
	new ProductCategoryAttributePolicy();

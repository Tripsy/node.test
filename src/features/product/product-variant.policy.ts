import ProductEntity from '@/features/product/product.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

/**
 * Gated on `product` rather than on a permission of its own: a variant is a product's sellable
 * unit, edited through the product form, so anyone who may read the catalog may read its rows.
 * A separate entry would be a second switch nobody remembers to grant.
 */
export class ProductVariantPolicy extends PolicyAbstract {
	constructor() {
		const entity = ProductEntity.NAME;

		super(entity);
	}
}

export const productVariantPolicy = new ProductVariantPolicy();

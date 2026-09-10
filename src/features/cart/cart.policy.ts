import CartEntity from '@/features/cart/cart.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

/**
 * Dashboard authorization only. The storefront endpoints check no permission and require no
 * account - a guest with a cart is the case the whole feature exists for - and are authorized by
 * the cart token instead: `CartService.findWritable` applies the handle and the active status
 * together, so a caller can only ever reach the cart they hold the handle for.
 *
 * `create` is absent from the dashboard surface. A cart is something a shopper accumulates, not a
 * record filed on their behalf, and one made in the back office would have no token anybody holds.
 */
export class CartPolicy extends PolicyAbstract {
	constructor() {
		const entity = CartEntity.NAME;

		super(entity);
	}
}

export const cartPolicy = new CartPolicy();

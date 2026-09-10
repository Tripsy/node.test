import { cartService } from '@/features/cart/cart.service';

// Hourly, off the hour so it does not compete with the sweeps scheduled at :00. Expiry is measured
// in days, so the exact minute a cart turns abandoned does not matter - only that nothing sits
// expired long enough to be quoted stale prices from.
export const SCHEDULE_EXPRESSION = '17 * * * *';
export const EXPECTED_RUN_TIME = 5; // seconds

/**
 * Retires carts nobody came back to.
 *
 * Two steps in one run, deliberately in this order: active carts past `expires_at` become
 * `abandoned`, and abandoned ones older than the purge window are deleted. The gap between the two
 * is what abandonment reporting - and any "here is what you left behind" message - reads from, so
 * a cart is never created and destroyed by the same pass.
 */
const cleanCart = async () => {
	return cartService.cleanUp();
};

export default cleanCart;

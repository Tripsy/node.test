import { Configuration } from '@/config/settings.config';
import type { ProductVatCategory } from '@/features/product/product.entity';

/**
 * The VAT percentage a product's declared class resolves to, right now.
 *
 * A product carries a *class* (`standard`, `reduced`, ...) rather than a rate, because the rate is
 * a function of jurisdiction and date. This is the one place that turns the class into a number:
 * a cart prices its lines through it on every read, and `CartService.toOrder` calls it once more
 * at confirmation to snapshot the figure onto `order_product.vat_rate`, where it stops moving.
 *
 * The rates come from `vat.*` in the settings, so a deployment states them for its own
 * jurisdiction. An unknown class - a row written before the class was dropped from the enum -
 * falls back to `standard` rather than to zero: under-charging VAT is the error that costs money.
 */
export function resolveVatRate(category: ProductVatCategory): number {
	const rates = Configuration.get('vat');

	return rates[category] ?? rates.standard;
}

/**
 * Rounds a money figure to two decimals - the scale every `decimal(_, 2)` money column in the
 * schema stores, and the one a shopper is quoted in.
 *
 * Pricing is arithmetic over floats (a unit price times a quantity, a percentage of a subtotal),
 * so intermediate results carry binary-float noise that would otherwise surface as a total ending
 * in `.30000000000000004`. Every derived figure a cart or a discount hands back passes through
 * here, and it is applied per step rather than once at the end: the line totals are what the
 * basket sums, so rounding them late would let the parts disagree with the whole.
 */
export function roundMoney(value: number): number {
	return Math.round(value * 100) / 100;
}

/** ISO 4217 alphabetic code, as stored - uppercase, exactly three letters. */
export const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
export const CURRENCY_CODE_CHARS = 3;

/**
 * Brings a currency code to the one form the schema stores: trimmed and upper-cased.
 *
 * Every currency column is `char(3)` and Postgres does not fold case, so `ron` and `RON` are two
 * distinct values to it - and to the unique indexes built over them. `product_price` is keyed on
 * `(variant_id, currency)`, so an un-normalized code does not collide with its uppercase twin: it
 * is accepted as a *second* price for the same market, and which one a cart reads is then a
 * question of row order. Normalizing at the boundary is what keeps that pair meaningful.
 *
 * Shape is not checked here - callers that need it refuse a bad code through
 * `CURRENCY_CODE_PATTERN`, with the message their own layer owns.
 */
export function normalizeCurrency(value: string): string {
	return value.trim().toUpperCase();
}

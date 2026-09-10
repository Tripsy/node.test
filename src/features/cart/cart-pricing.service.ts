import { In } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import type CartEntity from '@/features/cart/cart.entity';
import type CartItemEntity from '@/features/cart/cart-item.entity';
import type { DiscountSnapshot } from '@/features/discount/discount.entity';
import {
	type DiscountResolutionService,
	discountResolutionService,
} from '@/features/discount/discount-resolution.service';
import {
	type ExchangeRateService,
	exchangeRateService,
} from '@/features/exchange-rate/exchange-rate.service';
import type ProductEntity from '@/features/product/product.entity';
import { ProductSaleStatusEnum } from '@/features/product/product.entity';
import ProductCategoryEntity from '@/features/product/product-category.entity';
import type { ProductOptionSnapshot } from '@/features/product/product-option.entity';
import ProductOptionEntity from '@/features/product/product-option.entity';
import ProductOptionPriceEntity from '@/features/product/product-option-price.entity';
import ProductPriceEntity from '@/features/product/product-price.entity';
import ProductVariantEntity from '@/features/product/product-variant.entity';
import TermContentEntity from '@/features/term/term-content.entity';
import { resolveVatRate, roundMoney } from '@/helpers/shop.helper';

/**
 * Why a line cannot be bought as it stands. The line is still returned when one of these is set -
 * a shopper has to see what dropped out and why, rather than find their cart quietly shorter - but
 * it contributes nothing to the totals and blocks checkout.
 */
export const CartLineIssueEnum = {
	VARIANT_GONE: 'variant_gone', // Variant or product deleted from the catalog
	NOT_SELLABLE: 'not_sellable', // Outside its availability window, or discontinued
	NO_PRICE: 'no_price', // No `product_price` row in the cart's currency
	OPTION_GONE: 'option_gone', // A chosen option no longer exists on the product
} as const;

export type CartLineIssue =
	(typeof CartLineIssueEnum)[keyof typeof CartLineIssueEnum];

/**
 * One priced line. Every money field here is **derived** and lives only in the response - nothing
 * below is stored on `cart_item`, which is the whole reason a cart may sit untouched for weeks and
 * still quote today's catalog.
 */
export type CartLine = {
	id: number;
	variant_id: number;
	product_id: number;
	sku: string | null;
	quantity: number;
	notes: string | null;

	/** Unit price excluding VAT, in the cart's currency, options already folded in. */
	unit_price: number;
	/** The catalog price before the options moved it, for a UI that wants to show the delta. */
	base_price: number;
	options: ProductOptionSnapshot[];

	vat_rate: number;
	/** `unit_price × quantity`, excluding VAT and before any discount. */
	subtotal: number;
	/** Money off the whole line, in the cart's currency. */
	discount_reduction: number;
	discount: DiscountSnapshot | null;
	/** `subtotal - discount_reduction`, excluding VAT. What the line actually costs. */
	total: number;
	vat_amount: number;

	issue: CartLineIssue | null;
};

export type CartPricing = {
	currency: string;
	exchange_rate: number;
	lines: CartLine[];
	/** Sum of `subtotal` over sellable lines, excluding VAT. */
	subtotal: number;
	discount_reduction: number;
	vat_amount: number;
	/** What the shopper would pay, VAT included. */
	total: number;
	/** True while any line carries an `issue` - checkout is refused until they are resolved. */
	has_issues: boolean;
};

/**
 * Whether the catalog will sell this product right now.
 *
 * `sale_status` is recomputed by a cron rather than on read, so it lags its own window by up to
 * one run. The dates are therefore checked here as well: a cart is priced at the moment somebody
 * looks at it, and quoting a product whose window closed an hour ago is a promise the checkout
 * would then have to break.
 */
function isSellable(product: ProductEntity, now: Date): boolean {
	if (product.sale_status === ProductSaleStatusEnum.DISCONTINUED) {
		return false;
	}

	if (product.discontinued_at !== null) {
		return false;
	}

	if (product.available_from !== null && product.available_from > now) {
		return false;
	}

	if (product.available_until !== null && product.available_until < now) {
		return false;
	}

	return true;
}

/**
 * Turns the stored references on a cart into money, against the catalog as it is at `now`.
 *
 * Everything is loaded in a fixed number of queries whatever the cart holds - variants, prices,
 * categories and options each come back in one round trip and are indexed in memory. A per-line
 * lookup would be an N+1 on a path the storefront hits on every page that shows a basket badge.
 */
export class CartPricingService {
	constructor(
		private discountResolution: DiscountResolutionService,
		private exchangeRate: ExchangeRateService,
	) {}

	public async price(
		cart: CartEntity,
		items: CartItemEntity[],
		language: string = Configuration.language(),
		now: Date = new Date(),
	): Promise<CartPricing> {
		const baseCurrency = Configuration.currency();

		/*
		 * Falling back to 1 rather than refusing: an unpublished rate is a back-office gap, and
		 * the shopper's own currency is what they are quoted either way. It only skews how an
		 * `amount` discount and `min_order_value` - both stated in base currency - convert, so
		 * the failure is a mispriced promotion rather than a mispriced product.
		 */
		const exchangeRate =
			(await this.exchangeRate.getRateAsOf(
				cart.currency,
				now,
				baseCurrency,
			)) ?? 1;

		if (items.length === 0) {
			return {
				currency: cart.currency,
				exchange_rate: exchangeRate,
				lines: [],
				subtotal: 0,
				discount_reduction: 0,
				vat_amount: 0,
				total: 0,
				has_issues: false,
			};
		}

		const catalog = await this.loadCatalog(cart.currency, language, items);

		// First pass: what each line costs before any discount. The basket subtotal has to exist
		// before the discounts are resolved, since `min_order_value` is a condition on it.
		const draftLines = items.map((item) =>
			this.buildLine(item, cart.currency, catalog, now),
		);

		const subtotal = roundMoney(
			draftLines.reduce(
				(sum, line) =>
					line.issue === null ? sum + line.subtotal : sum,
				0,
			),
		);

		// Second pass: the best discount per line, costed against that subtotal.
		const lines = await Promise.all(
			draftLines.map(async (line) => {
				if (line.issue !== null) {
					return line;
				}

				const resolved = await this.discountResolution.resolveForLine({
					variantId: line.variant_id,
					productId: line.product_id,
					brandId:
						catalog.brandByProduct.get(line.product_id) ?? null,
					categoryIds:
						catalog.categoriesByProduct.get(line.product_id) ?? [],
					quantity: line.quantity,
					unitPrice: line.unit_price,
					exchangeRate: exchangeRate,
					minPrice:
						catalog.minPriceByVariant.get(line.variant_id) ?? null,
					orderValue: subtotal,
					now: now,
				});

				const reduction = resolved?.reduction ?? 0;
				const total = roundMoney(line.subtotal - reduction);

				return {
					...line,
					discount_reduction: reduction,
					discount: resolved?.snapshot ?? null,
					total: total,
					vat_amount: roundMoney((total * line.vat_rate) / 100),
				};
			}),
		);

		const sellable = lines.filter((line) => line.issue === null);

		const discountReduction = roundMoney(
			sellable.reduce((sum, line) => sum + line.discount_reduction, 0),
		);
		const vatAmount = roundMoney(
			sellable.reduce((sum, line) => sum + line.vat_amount, 0),
		);
		const netTotal = roundMoney(subtotal - discountReduction);

		return {
			currency: cart.currency,
			exchange_rate: exchangeRate,
			lines: lines,
			subtotal: subtotal,
			discount_reduction: discountReduction,
			vat_amount: vatAmount,
			total: roundMoney(netTotal + vatAmount),
			has_issues: lines.some((line) => line.issue !== null),
		};
	}

	/**
	 * Everything the lines need from the catalog, in four queries regardless of cart size.
	 *
	 * Variants are read `withDeleted` on purpose. A soft-deleted variant is the everyday case the
	 * CASCADE foreign key never fires for, and finding nothing would make the line vanish from the
	 * response with no explanation; loading it lets the pass report `variant_gone` against a line
	 * the shopper can still see and remove.
	 */
	private async loadCatalog(
		currency: string,
		language: string,
		items: CartItemEntity[],
	) {
		const variantIds = [...new Set(items.map((item) => item.variant_id))];
		const productIds = [...new Set(items.map((item) => item.product_id))];
		const optionIds = [
			...new Set(items.flatMap((item) => item.options ?? [])),
		];

		const [
			variants,
			prices,
			productCategories,
			options,
			optionPrices,
			optionLabels,
		] = await Promise.all([
			dataSource.getRepository(ProductVariantEntity).find({
				where: { id: In(variantIds) },
				relations: { product: true },
				withDeleted: true,
			}),
			dataSource.getRepository(ProductPriceEntity).find({
				where: { variant_id: In(variantIds), currency: currency },
			}),
			dataSource.getRepository(ProductCategoryEntity).find({
				where: { product_id: In(productIds) },
			}),
			optionIds.length === 0
				? []
				: dataSource.getRepository(ProductOptionEntity).find({
						where: { id: In(optionIds) },
						relations: { option_group: true },
					}),
			optionIds.length === 0
				? []
				: dataSource.getRepository(ProductOptionPriceEntity).find({
						where: {
							option_id: In(optionIds),
							currency: currency,
						},
					}),
			/*
			 * Option labels are `term` rows, so the name the shopper sees is resolved in
			 * their own content language - the same source the menu renders from. The
			 * lookup is by `label_id`, which is known only after the options come back,
			 * so this reads the terms of every option cited by the cart and discards the
			 * ones the lines turn out not to need.
			 */
			optionIds.length === 0
				? []
				: dataSource
						.getRepository(TermContentEntity)
						.createQueryBuilder('content')
						.innerJoin(
							ProductOptionEntity,
							'option',
							'option.label_id = content.term_id',
						)
						.where('option.id IN (:...optionIds)', {
							optionIds,
						})
						.andWhere('content.language = :language', {
							language,
						})
						.select([
							'content.term_id AS term_id',
							'content.value AS value',
						])
						.getRawMany<{ term_id: number; value: string }>(),
		]);

		const categoriesByProduct = new Map<number, number[]>();

		for (const row of productCategories) {
			const list = categoriesByProduct.get(row.product_id) ?? [];

			list.push(row.category_id);
			categoriesByProduct.set(row.product_id, list);
		}

		const brandByProduct = new Map<number, number | null>();

		for (const variant of variants) {
			if (variant.product) {
				brandByProduct.set(
					variant.product.id,
					variant.product.brand_id,
				);
			}
		}

		return {
			variantById: new Map(
				variants.map((variant) => [variant.id, variant]),
			),
			priceByVariant: new Map(
				prices.map((price) => [price.variant_id, price.sale_price]),
			),
			minPriceByVariant: new Map(
				prices.map((price) => [price.variant_id, price.min_price]),
			),
			optionById: new Map(options.map((option) => [option.id, option])),
			optionDeltaById: new Map(
				optionPrices.map((price) => [
					price.option_id,
					price.price_delta,
				]),
			),
			labelByTerm: new Map(
				optionLabels.map((row) => [row.term_id, row.value]),
			),
			categoriesByProduct: categoriesByProduct,
			brandByProduct: brandByProduct,
		};
	}

	/** One line priced from the catalog, before discounts. */
	private buildLine(
		item: CartItemEntity,
		currency: string,
		catalog: Awaited<ReturnType<CartPricingService['loadCatalog']>>,
		now: Date,
	): CartLine {
		const quantity = Number(item.quantity);

		const empty: CartLine = {
			id: item.id,
			variant_id: item.variant_id,
			product_id: item.product_id,
			sku: null,
			quantity: quantity,
			notes: item.notes,
			unit_price: 0,
			base_price: 0,
			options: [],
			vat_rate: 0,
			subtotal: 0,
			discount_reduction: 0,
			discount: null,
			total: 0,
			vat_amount: 0,
			issue: CartLineIssueEnum.VARIANT_GONE,
		};

		const variant = catalog.variantById.get(item.variant_id);

		if (!variant || variant.deleted_at !== null || !variant.product) {
			return empty;
		}

		const product = variant.product;
		const line = {
			...empty,
			sku: variant.sku,
			issue: null as CartLineIssue | null,
		};

		if (product.deleted_at !== null || !isSellable(product, now)) {
			return { ...line, issue: CartLineIssueEnum.NOT_SELLABLE };
		}

		const basePrice = catalog.priceByVariant.get(item.variant_id);

		if (basePrice === undefined) {
			return { ...line, issue: CartLineIssueEnum.NO_PRICE };
		}

		const chosen = item.options ?? [];
		const snapshots: ProductOptionSnapshot[] = [];

		let optionsDelta = 0;

		for (const optionId of chosen) {
			const option = catalog.optionById.get(optionId);

			if (!option || option.deleted_at !== null) {
				return { ...line, issue: CartLineIssueEnum.OPTION_GONE };
			}

			/*
			 * A missing price row is a zero delta, not a failed line: the option exists and the
			 * product is answerable, the market simply carries no surcharge for it. Contrast a
			 * missing `product_price`, which leaves nothing to charge at all.
			 */
			const delta = catalog.optionDeltaById.get(optionId) ?? 0;

			optionsDelta += Number(delta);

			snapshots.push({
				label:
					catalog.labelByTerm.get(option.label_id) ??
					String(option.label_id),
				price_delta: Number(delta),
				currency: currency,
			});
		}

		const unitPrice = roundMoney(Number(basePrice) + optionsDelta);
		const vatRate = resolveVatRate(product.vat_category);
		const subtotal = roundMoney(unitPrice * quantity);

		return {
			...line,
			unit_price: unitPrice,
			base_price: Number(basePrice),
			options: snapshots,
			vat_rate: vatRate,
			subtotal: subtotal,
			total: subtotal,
			vat_amount: roundMoney((subtotal * vatRate) / 100),
		};
	}
}

export const cartPricingService = new CartPricingService(
	discountResolutionService,
	exchangeRateService,
);

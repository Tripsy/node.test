import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type CartEntity from '@/features/cart/cart.entity';
import type ProductVariantEntity from '@/features/product/product-variant.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

const ENTITY_TABLE_NAME = 'cart_item';

/**
 * One line a shopper picked: which variant, how many, and which options they answered the
 * product's questions with.
 *
 * **It carries no money.** Not `price`, not `vat_rate`, not `exchange_rate`, and no discount
 * snapshot - the contract that `order_product` exists to hold. A line here is a *reference*: the
 * cart is re-priced from the catalog on every read, so a cart open for three weeks shows the price
 * it would be charged today rather than the one that applied when the shopper clicked. The freeze
 * happens exactly once, when `CartService.toOrder` copies the resolved figures into
 * `order_product`.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores cart lines; deliberately holds no prices',
})
@Check('CHK_cart_item_quantity', '(quantity > 0)')
/*
 * Re-adding the same configuration increments the line it matches rather than creating a second
 * one; a different set of options is a genuinely different line and gets its own row.
 *
 * The hash is what makes that expressible as an index - jsonb has no useful equality for this,
 * since `[3,1]` and `[1,3]` are the same choice written two ways. `CartService` normalizes and
 * hashes the ids, so the column is the canonical form of `options` and the two are written
 * together or not at all.
 */
@Index('UQ_cart_item_line', ['cart_id', 'variant_id', 'options_hash'], {
	unique: true,
	where: 'deleted_at IS NULL',
})
export default class CartItemEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = false;

	@Column('int', { nullable: false })
	@Index('IDX_cart_item_cart_id')
	cart_id!: number;

	@Column('int', { nullable: false })
	@Index('IDX_cart_item_variant_id')
	variant_id!: number;

	/**
	 * Denormalized alongside `variant_id` and held to it by the composite foreign key below, the
	 * same arrangement `order_product` uses. Pricing needs the product on every line - for its VAT
	 * class, and as a discount target - and this saves a join to reach it.
	 */
	@Column('int', { nullable: false })
	product_id!: number;

	@Column('numeric', { precision: 12, scale: 2, nullable: false })
	quantity!: number;

	/**
	 * The `product_option` ids chosen, ascending. **Ids, not snapshots** - the price delta each
	 * one carries is looked up when the cart is priced, so an option repriced overnight is
	 * reflected the next time the shopper opens their cart.
	 */
	@Column('jsonb', {
		nullable: true,
		comment: 'Chosen product_option ids, ascending',
	})
	options!: number[] | null;

	/**
	 * Canonical form of `options`, for `UQ_cart_item_line`. Empty string when no option was
	 * chosen, never null - a null would let the same optionless line be inserted twice, since
	 * Postgres treats nulls in a unique index as distinct.
	 */
	@Column('varchar', {
		length: 64,
		nullable: false,
		default: '',
		comment: 'Hash of the ascending option ids, empty when there are none',
	})
	options_hash!: string;

	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('CartEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'cart_id' })
	cart!: CartEntity;

	/**
	 * Composite over both columns at once, pointing at `product_variant (id, product_id)`, so a
	 * line cannot name a variant belonging to a different product.
	 *
	 * **CASCADE, deliberately not the RESTRICT `order_product` carries.** An order line is a
	 * financial record that has to outlive the catalog; a cart line is a shopper's shortlist. With
	 * RESTRICT here, every abandoned cart would pin the variants it named and a withdrawn product
	 * could not be deleted until the last cart mentioning it was cleared. A withdrawn product
	 * drops out of carts instead. Variants are soft-deleted in normal use, so this fires only on a
	 * real purge - the everyday case is a soft-deleted variant, which the pricing pass reports as
	 * unavailable and leaves the line in place for the shopper to see and remove.
	 */
	@ManyToOne('ProductVariantEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn([
		{ name: 'variant_id', referencedColumnName: 'id' },
		{ name: 'product_id', referencedColumnName: 'product_id' },
	])
	variant?: ProductVariantEntity;
}

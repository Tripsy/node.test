import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import type CartItemEntity from '@/features/cart/cart-item.entity';
import type OrderEntity from '@/features/order/order.entity';
import type UserEntity from '@/features/user/user.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import type { StatusTransitions } from '@/shared/types/common.type';

export const CartStatusEnum = {
	ACTIVE: 'active', // Being filled; the only status a write is accepted on
	CONVERTED: 'converted', // Turned into an order, `order_id` names it
	ABANDONED: 'abandoned', // Expired, or superseded by a merge into the owner's own cart
} as const;

export type CartStatus = (typeof CartStatusEnum)[keyof typeof CartStatusEnum];

/**
 * `converted` and `abandoned` are both terminal. A buyer who comes back after either gets a new
 * cart rather than a revived one: the converted cart is the record of what an order was built
 * from, and reopening an abandoned one would resurrect prices and a product selection the sweep
 * has already declared stale.
 */
export const STATUS_TRANSITIONS: StatusTransitions<CartStatus> = {
	[CartStatusEnum.ACTIVE]: [
		CartStatusEnum.CONVERTED,
		CartStatusEnum.ABANDONED,
	],
	[CartStatusEnum.CONVERTED]: [],
	[CartStatusEnum.ABANDONED]: [],
};

/**
 * How long an untouched cart stays active. Slid forward on every write, so this measures silence
 * rather than age - a shopper who adds something on day 29 keeps the cart for another 30 days.
 */
export const CART_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * How long an abandoned cart is kept before the cleanup cron removes it for good. The gap exists
 * so a shopper who comes back a few days late can be shown what they had, and so abandonment
 * reporting has something to count.
 */
export const CART_PURGE_AFTER_SECONDS = 60 * 24 * 60 * 60;

const ENTITY_TABLE_NAME = 'cart';

/**
 * What a shopper has picked out but not yet bought: no identity, no document number, and today's
 * price on every read - the row holds references only. It becomes an order at
 * `CartService.toOrder`, which is where a billing counterparty, a `document_series` number and
 * frozen price/VAT/exchange-rate figures are first attached.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores shopping carts, for guests and members alike',
})
/*
 * One live cart per member. Partial on both the status and the soft delete, so a converted or
 * abandoned cart leaves the slot free - which is what lets the same account start a new one
 * immediately after checking out.
 */
@Index('UQ_cart_user_active', ['user_id'], {
	unique: true,
	where: `user_id IS NOT NULL AND status = 'active' AND deleted_at IS NULL`,
})
// The cleanup cron's whole query. Partial because it only ever looks at carts still active - the
// terminal statuses dominate the table over time and have no expiry left to check.
@Index('IDX_cart_expires_at', ['expires_at'], {
	where: `status = 'active' AND deleted_at IS NULL`,
})
// The referencing side of `order_id`, which Postgres does not index on its own; without it every
// hard delete of an order scans this table. Partial: the column is null on every cart that has
// not checked out, and a lookup by order implies the predicate anyway.
@Index('IDX_cart_order_id', ['order_id'], {
	where: 'order_id IS NOT NULL',
})
export default class CartEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = false;

	/**
	 * The guest's identity: an opaque handle the client keeps and sends back in `X-Cart-Token`,
	 * and the only way an unauthenticated caller can name their own cart.
	 *
	 * Returned in the response body rather than set as a cookie, matching how this API already
	 * hands out its access token - the caller decides where to keep it, and nothing depends on
	 * cross-site cookie behavior between the API and a frontend on another host.
	 *
	 * A random uuid rather than the `user_ip_hash` that `comment` and `rating` use. That column is
	 * abuse control on a low-value row, and it is wrong for this job in both directions - one
	 * address is shared by everyone behind a NAT, and a shopper's address changes between the
	 * train and the sofa while the cart is supposed to survive both.
	 *
	 * It stays set after a merge, so a member browsing in a second, signed-out tab still resolves
	 * to a cart rather than silently starting another one.
	 */
	@Column('uuid', {
		nullable: false,
		comment: 'Opaque handle held by the client, guest identity',
	})
	@Index('UQ_cart_token', { unique: true })
	token!: string;

	/**
	 * Set when the shopper is signed in, either because the cart was created that way or because
	 * `CartService.merge` claimed a guest cart at login. Null on every cart still anonymous.
	 */
	@Column('int', {
		nullable: true,
	})
	user_id!: number | null;

	@Column({
		type: 'enum',
		enum: CartStatusEnum,
		default: CartStatusEnum.ACTIVE,
		nullable: false,
	})
	status!: CartStatus;

	/**
	 * The order this cart became, once it did. This is the direction the dependency runs - a cart
	 * knows the order it produced, an order knows nothing about carts - which keeps `order`
	 * installable without `cart`.
	 */
	@Column('int', {
		nullable: true,
	})
	order_id!: number | null;

	/**
	 * The market the cart is priced in, and the currency every `product_price` lookup is made
	 * against. Stored rather than re-read per request so a shopper who switches market gets an
	 * explicit reprice instead of a total that changes under them mid-session.
	 */
	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
		comment: 'Market the cart is priced in',
	})
	currency!: string;

	/**
	 * When the cleanup cron may declare the cart abandoned. Slid forward on every write, so a cart
	 * being worked on never expires and one left alone does.
	 */
	@Column('timestamp', {
		nullable: false,
	})
	expires_at!: Date;

	// RELATIONS

	// CASCADE: a cart is the account's own working state, not a record anybody has to keep, so a
	// closed account takes its carts - and through them their items - with it.
	@ManyToOne('UserEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity | null;

	// SET NULL rather than CASCADE: a purged order should cost the converted cart its provenance,
	// not its existence. Orders are soft-deleted in normal use, so this fires only on a real purge.
	@ManyToOne('OrderEntity', {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'order_id' })
	order?: OrderEntity | null;

	@OneToMany('CartItemEntity', (item: CartItemEntity) => item.cart)
	items?: CartItemEntity[];
}

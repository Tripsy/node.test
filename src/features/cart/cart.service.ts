import { createHash, randomUUID } from 'node:crypto';
import { LessThan } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/message.setup';
import { Configuration } from '@/config/settings.config';
import { BadRequestError, NotFoundError } from '@/exceptions';
import type CartEntity from '@/features/cart/cart.entity';
import {
	CART_PURGE_AFTER_SECONDS,
	CART_TTL_SECONDS,
	CartStatusEnum,
	STATUS_TRANSITIONS,
} from '@/features/cart/cart.entity';
import {
	getCartItemRepository,
	getCartRepository,
} from '@/features/cart/cart.repository';
import type { CartValidator } from '@/features/cart/cart.validator';
import CartItemEntity from '@/features/cart/cart-item.entity';
import {
	type CartPricing,
	type CartPricingService,
	cartPricingService,
} from '@/features/cart/cart-pricing.service';
import type OrderEntity from '@/features/order/order.entity';
import {
	type OrderService,
	orderService,
} from '@/features/order/order.service';
import { createFutureDate, createPastDate } from '@/helpers/date.helper';
import { assertValidStatusTransition } from '@/shared/abstracts/service.abstract';
import type { ValidatorOutput } from '@/shared/types/mock.type';

/** A cart plus what it currently costs - the only shape the storefront is ever handed. */
export type CartWithPricing = {
	id: number;
	token: string;
	status: CartEntity['status'];
	currency: string;
	user_id: number | null;
	order_id: number | null;
	expires_at: Date;
	pricing: CartPricing;
};

/**
 * The canonical form of a line's option set, and what `UQ_cart_item_line` compares.
 *
 * Sorted and de-duplicated before hashing, so `[3, 1]` and `[1, 3, 3]` are recognized as the same
 * choice and increment one line instead of creating three. An empty set hashes to the empty
 * string rather than to the hash of nothing, because the column is `NOT NULL` and a sentinel that
 * reads as "no options" beats one that reads as a hash nobody can reproduce.
 */
export function normalizeOptions(options?: number[] | null): {
	options: number[] | null;
	hash: string;
} {
	const unique = [...new Set(options ?? [])].sort(
		(first, second) => first - second,
	);

	if (unique.length === 0) {
		return { options: null, hash: '' };
	}

	return {
		options: unique,
		hash: createHash('sha256').update(unique.join(',')).digest('hex'),
	};
}

export class CartService {
	constructor(
		private repository: ReturnType<typeof getCartRepository>,
		private itemRepository: ReturnType<typeof getCartItemRepository>,
		private pricing: CartPricingService,
		private orderService: OrderService,
	) {}

	/**
	 * The cart a request belongs to, created when there is none.
	 *
	 * The account wins over the token whenever both are present: a signed-in shopper has exactly
	 * one live cart by `UQ_cart_user_active`, and honoring a stale cookie instead would let a
	 * second tab write to a cart the first one cannot see. `merge` is what reconciles the two, and
	 * it is called from here so signing in with a full guest cart never loses it.
	 */
	public async resolve(
		token: string | null,
		userId: number | null,
		currency: string = Configuration.currency(),
	): Promise<CartEntity> {
		if (userId) {
			if (token) {
				const merged = await this.merge(token, userId);

				if (merged) {
					return merged;
				}
			}

			const existing = await this.repository
				.createQuery()
				.filterBy('user_id', userId)
				.filterByStatus(CartStatusEnum.ACTIVE)
				.first();

			if (existing) {
				return existing;
			}
		}

		if (token) {
			const existing = await this.repository
				.createQuery()
				.filterBy('token', token)
				.filterByStatus(CartStatusEnum.ACTIVE)
				.first();

			if (existing) {
				return existing;
			}
		}

		return this.create(userId, currency);
	}

	private async create(
		userId: number | null,
		currency: string,
	): Promise<CartEntity> {
		const entry = this.repository.create({
			token: randomUUID(),
			user_id: userId,
			status: CartStatusEnum.ACTIVE,
			order_id: null,
			currency: currency,
			expires_at: createFutureDate(CART_TTL_SECONDS),
		});

		return this.repository.save(entry);
	}

	/**
	 * The cart a caller may write to, or a 404.
	 *
	 * Both halves of the address are applied at once - the handle *and* `status = 'active'` - so
	 * there is no ownership check left for a later step to forget. A token naming somebody else's
	 * cart and a token naming a cart that has already checked out are the same answer: not found.
	 */
	public async findWritable(
		token: string,
		userId: number | null,
	): Promise<CartEntity> {
		const query = this.repository
			.createQuery()
			.filterByStatus(CartStatusEnum.ACTIVE);

		if (userId) {
			query.filterBy('user_id', userId);
		} else {
			query.filterBy('token', token);
		}

		const entry = await query.first();

		if (!entry) {
			throw new NotFoundError(lang('cart.error.not_found'));
		}

		return entry;
	}

	/**
	 * Claims a guest cart for an account at login.
	 *
	 * Quantities are summed on collision rather than overwritten: both baskets were built
	 * deliberately, and the shopper can lower a number far more easily than they can remember what
	 * the other tab held. Lines that exist only on one side move across untouched.
	 *
	 * Returns null when there is nothing to merge, which is the common case - most sign-ins happen
	 * with an empty guest cart or none at all.
	 */
	public async merge(
		guestToken: string,
		userId: number,
	): Promise<CartEntity | null> {
		const guestCart = await this.repository
			.createQuery()
			.filterBy('token', guestToken)
			.filterByStatus(CartStatusEnum.ACTIVE)
			.first();

		if (!guestCart || guestCart.user_id === userId) {
			return guestCart;
		}

		// Somebody else's live cart. The cookie is stale or forged; either way it is not this
		// account's to claim, and answering with their own cart is the safe outcome.
		if (guestCart.user_id !== null) {
			return null;
		}

		const memberCart = await this.repository
			.createQuery()
			.filterBy('user_id', userId)
			.filterByStatus(CartStatusEnum.ACTIVE)
			.first();

		if (!memberCart) {
			// Nothing to fold into - the guest cart simply becomes the member's, which keeps its
			// token valid and costs no row copying.
			guestCart.user_id = userId;
			guestCart.expires_at = createFutureDate(CART_TTL_SECONDS);

			return this.repository.save(guestCart);
		}

		await dataSource.transaction(async (manager) => {
			const guestItems = await manager.find(CartItemEntity, {
				where: { cart_id: guestCart.id },
			});
			const memberItems = await manager.find(CartItemEntity, {
				where: { cart_id: memberCart.id },
			});

			const byLine = new Map(
				memberItems.map((item) => [
					`${item.variant_id}:${item.options_hash}`,
					item,
				]),
			);

			for (const item of guestItems) {
				const key = `${item.variant_id}:${item.options_hash}`;
				const existing = byLine.get(key);

				if (existing) {
					existing.quantity =
						Number(existing.quantity) + Number(item.quantity);

					await manager.save(existing);

					continue;
				}

				item.cart_id = memberCart.id;

				await manager.save(item);
			}

			memberCart.expires_at = createFutureDate(CART_TTL_SECONDS);
			guestCart.status = CartStatusEnum.ABANDONED;

			await manager.save([memberCart, guestCart]);
		});

		return memberCart;
	}

	/**
	 * Adds a line, or raises the quantity of the one already holding the same configuration.
	 *
	 * The upsert is decided on the normalized option hash rather than on the ids as sent, so the
	 * same choice reaches the same row however the client ordered it.
	 */
	public async addItem(
		cart: CartEntity,
		data: ValidatorOutput<CartValidator, 'addItem'>,
	): Promise<CartItemEntity> {
		const { options, hash } = normalizeOptions(data.options);

		const existing = await this.itemRepository
			.createQuery()
			.filterBy('cart_id', cart.id)
			.filterBy('variant_id', data.variant_id)
			.filterBy('options_hash', hash)
			.first();

		const entry = existing
			? Object.assign(existing, {
					quantity: Number(existing.quantity) + data.quantity,
					notes: data.notes ?? existing.notes,
				})
			: this.itemRepository.create({
					cart_id: cart.id,
					variant_id: data.variant_id,
					product_id: data.product_id,
					quantity: data.quantity,
					options: options,
					options_hash: hash,
					notes: data.notes ?? null,
				});

		const saved = await this.itemRepository.save(entry);

		await this.touch(cart);

		return saved;
	}

	/**
	 * Changes a line's quantity or note. The options are not editable: a different option set is a
	 * different line by `UQ_cart_item_line`, so changing them here would either collide with an
	 * existing row or silently merge two lines the shopper still sees as separate. The client
	 * removes and re-adds instead.
	 */
	public async updateItem(
		cart: CartEntity,
		data: ValidatorOutput<CartValidator, 'updateItem'>,
	): Promise<CartItemEntity> {
		const entry = await this.itemRepository
			.createQuery()
			.filterBy('cart_id', cart.id)
			.filterById(data.id)
			.first();

		if (!entry) {
			throw new NotFoundError(lang('cart.error.item_not_found'));
		}

		if (data.quantity !== undefined) {
			entry.quantity = data.quantity;
		}

		if (data.notes !== undefined) {
			entry.notes = data.notes;
		}

		const saved = await this.itemRepository.save(entry);

		await this.touch(cart);

		return saved;
	}

	/**
	 * Hard delete, deliberately. A line the shopper took out is not a record anybody keeps, and a
	 * soft-deleted one would sit under `UQ_cart_item_line`'s partial predicate forever - harmless,
	 * but it turns a cart's row count into something that only grows.
	 */
	public async removeItem(cart: CartEntity, itemId: number): Promise<void> {
		// Checked before the delete rather than after: `RepositoryAbstract.delete` throws its own
		// generic not-found, and a line the shopper already removed in another tab should read as
		// this feature's message rather than as a bare `cart_item.error.not_found`.
		const entry = await this.itemRepository
			.createQuery()
			.filterBy('cart_id', cart.id)
			.filterById(itemId)
			.first();

		if (!entry) {
			throw new NotFoundError(lang('cart.error.item_not_found'));
		}

		await this.itemRepository
			.createQuery()
			.filterBy('cart_id', cart.id)
			.filterById(itemId)
			.delete(false, false);

		await this.touch(cart);
	}

	/** Emptying an already-empty cart is a no-op, not a 404 - the caller asked for a state, not a row. */
	public async clear(cart: CartEntity): Promise<void> {
		const count = await this.itemRepository
			.createQuery()
			.filterBy('cart_id', cart.id)
			.count();

		if (count > 0) {
			await this.itemRepository
				.createQuery()
				.filterBy('cart_id', cart.id)
				.delete(false, true);
		}

		await this.touch(cart);
	}

	/**
	 * Repricing the whole cart into another market. Nothing is stored per line, so this is a
	 * single column - which is exactly the property the cart/order split was chosen for.
	 */
	public async setCurrency(
		cart: CartEntity,
		currency: string,
	): Promise<CartEntity> {
		cart.currency = currency;

		return this.touch(cart);
	}

	/** Slides the expiry forward. Every write goes through it, so a cart in use never expires. */
	private async touch(cart: CartEntity): Promise<CartEntity> {
		cart.expires_at = createFutureDate(CART_TTL_SECONDS);

		return this.repository.save(cart);
	}

	public async getItems(cartId: number): Promise<CartItemEntity[]> {
		return this.itemRepository
			.createQuery()
			.filterBy('cart_id', cartId)
			.orderBy('id')
			.all();
	}

	/** The cart as the storefront sees it: the row, plus what it costs at this moment. */
	public async withPricing(
		cart: CartEntity,
		language?: string,
	): Promise<CartWithPricing> {
		const items = await this.getItems(cart.id);

		return {
			id: cart.id,
			token: cart.token,
			status: cart.status,
			currency: cart.currency,
			user_id: cart.user_id,
			order_id: cart.order_id,
			expires_at: cart.expires_at,
			pricing: await this.pricing.price(cart, items, language),
		};
	}

	/**
	 * Turns a cart into an order - the single point where the two models meet, and the only place
	 * a cart's prices stop moving.
	 *
	 * Everything happens in one transaction, and the series number is allocated inside it with the
	 * caller's manager, so an order that fails to write rolls the counter back with itself and the
	 * `ORD` series stays gapless.
	 *
	 * Prices are resolved once more here rather than reused from whatever the shopper was last
	 * shown. That read may be minutes or weeks old, and the figures written to `order_product` are
	 * the ones that will be invoiced - so they are taken at the moment of commitment, and the
	 * result is what the confirmation screen reports back.
	 *
	 * What the order *is* - the series allocation, the starting status, the line layout - belongs
	 * to `OrderService`. This method's job is the translation and the cart's own state change:
	 * decide the figures, hand them over, and record which order the cart became.
	 */
	public async toOrder(
		cart: CartEntity,
		clientId: number,
		notes: string | null = null,
		language?: string,
	): Promise<OrderEntity> {
		const items = await this.getItems(cart.id);

		if (items.length === 0) {
			throw new BadRequestError(lang('cart.error.empty'));
		}

		const pricing = await this.pricing.price(cart, items, language);

		if (pricing.has_issues) {
			throw new BadRequestError(lang('cart.error.has_issues'));
		}

		return dataSource.transaction(async (manager) => {
			/*
			 * The manager is handed over so the whole thing is one transaction: the series
			 * number `OrderService` allocates rolls back with the cart flip below, and a cart
			 * can never end up `converted` beside an order that failed to write.
			 */
			const order = await this.orderService.create(manager, {
				client_id: clientId,
				currency: pricing.currency,
				exchange_rate: pricing.exchange_rate,
				notes: notes,
				lines: pricing.lines.map((line) => ({
					variant_id: line.variant_id,
					product_id: line.product_id,
					quantity: line.quantity,
					// `unit_price`, not `total`: the order stores a unit figure and the
					// discount that applied to it separately, so the reduction stays visible
					// on the invoice instead of disappearing into the price.
					price: line.unit_price,
					vat_rate: line.vat_rate,
					discount: line.discount,
					options: line.options,
					notes: line.notes,
				})),
			});

			assertValidStatusTransition(
				STATUS_TRANSITIONS,
				cart.status,
				CartStatusEnum.CONVERTED,
			);

			cart.status = CartStatusEnum.CONVERTED;
			cart.order_id = order.id;

			await manager.save(cart);

			return order;
		});
	}

	/**
	 * The cleanup sweep, called by `cart-cleanup.cron.ts`.
	 *
	 * Two steps, in this order: active carts past their expiry become `abandoned`, and abandoned
	 * ones older than the purge window are removed outright. Doing it in one pass would delete a
	 * cart the same run that abandoned it, which is the window the reporting and the "here is what
	 * you left" email both live in.
	 */
	public async cleanUp(): Promise<{ abandoned: number; purged: number }> {
		/*
		 * A set-based UPDATE rather than a read-modify-write through the query layer: this is a
		 * status flip over a whole slice of the table with no per-row decision to make, and
		 * loading every expired cart to save it back would be the run's entire cost. The query
		 * layer has no bulk-update terminal, so this is the one place the feature touches the
		 * TypeORM repository directly.
		 */
		const abandoned = await this.repository.update(
			{
				status: CartStatusEnum.ACTIVE,
				expires_at: LessThan(new Date()),
			},
			{ status: CartStatusEnum.ABANDONED },
		);

		const purgeBefore = createPastDate(CART_PURGE_AFTER_SECONDS);

		const purgeable = await this.repository
			.createQuery()
			.filterBy('status', CartStatusEnum.ABANDONED)
			.filterByRange('updated_at', null, purgeBefore)
			.count();

		/*
		 * `force` for the same reason every retention sweep in the codebase passes it
		 * (`clean-account-token`, `clean-log-data`, `clean-cron-history`): `hasFilter` is only
		 * raised by a filter on an id column, so a date-scoped delete reads as unfiltered and is
		 * refused. The where clauses still apply - force skips the guard, not the filter.
		 *
		 * The count ahead of it is not the same guard: `delete` throws not-found when nothing
		 * matches, and an empty sweep is the normal outcome on most runs.
		 */
		const purged =
			purgeable === 0
				? 0
				: await this.repository
						.createQuery()
						.filterBy('status', CartStatusEnum.ABANDONED)
						.filterByRange('updated_at', null, purgeBefore)
						.delete(false, true, true);

		return {
			abandoned: abandoned.affected ?? 0,
			purged: purged,
		};
	}

	/**
	 * Soft, unlike the hard delete a line gets. A cart removed from the back office is a support
	 * action taken against a record somebody may have to explain later, and `restore` is what
	 * undoes it.
	 */
	public async delete(id: number): Promise<number> {
		return this.repository.createQuery().filterById(id).delete(true, false);
	}

	public async restore(id: number): Promise<number> {
		return this.repository.createQuery().filterById(id).restore(false);
	}

	public async findById(
		id: number,
		withDeleted = false,
	): Promise<CartEntity> {
		return this.repository
			.createQuery()
			.withDeleted(withDeleted)
			.filterById(id)
			.firstOrFail();
	}

	/** @description Used in `read` method from controller; this will return a custom shape */
	public async getEntryData(data: { id: number; withDeleted: boolean }) {
		const cart = await this.repository
			.createQuery()
			.withDeleted(data.withDeleted)
			.filterById(data.id)
			.firstOrFail();

		return this.withPricing(cart as CartEntity);
	}

	public findByFilter(
		data: ValidatorOutput<CartValidator, 'find'>,
		withDeleted: boolean,
	) {
		const query = this.repository
			.createQuery()
			.select([
				'id',
				'token',
				'user_id',
				'status',
				'order_id',
				'currency',
				'expires_at',
				'created_at',
				'updated_at',
			])
			.filterBy('status', data.filter.status)
			.filterBy('user_id', data.filter.user_id)
			.filterBy('order_id', data.filter.order_id)
			.filterBy('currency', data.filter.currency)
			// Both halves have to agree: the caller's role has to allow deleted rows *and* the
			// listing has to have asked for them.
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit);

		return query.all(true);
	}
}

export const cartService = new CartService(
	getCartRepository(),
	getCartItemRepository(),
	cartPricingService,
	orderService,
);

import type { EntityManager } from 'typeorm';
import { lang } from '@/config/message.setup';
import { BadRequestError } from '@/exceptions';
import type { DiscountSnapshot } from '@/features/discount/discount.entity';
import { DocumentTypeEnum } from '@/features/document-series/document-series.entity';
import { documentSeriesService } from '@/features/document-series/document-series.service';
import OrderEntity, {
	type OrderStatus,
	OrderStatusEnum,
	type OrderType,
	OrderTypeEnum,
	STATUS_TRANSITIONS,
} from '@/features/order/order.entity';
import { getOrderRepository } from '@/features/order/order.repository';
import OrderProductEntity from '@/features/order/order-product.entity';
import type { ProductOptionSnapshot } from '@/features/product/product-option.entity';
import {
	assertValidStatusTransition,
	cleanEntityCache,
} from '@/shared/abstracts/service.abstract';

/**
 * One line as the caller hands it over: already priced, already decided.
 *
 * **The order does not price anything.** Whoever asks for one has already resolved what the goods
 * cost - a cart against the live catalog, a subscription against the terms it renews under - and
 * this is where those figures stop moving. Deciding them here would mean re-deriving a number the
 * customer has already been shown, and quietly disagreeing with it.
 *
 * Deliberately not `CartLine`: an order is not a cart's output, it is a document several things
 * may raise. Naming the cart's type here would make `order` depend on `cart`, which is backwards -
 * and would leave the second caller converting into a shape it has no reason to know about.
 */
export type OrderLineInput = {
	variant_id: number;
	product_id: number;
	quantity: number;
	/** Unit price excluding VAT, in `currency`. */
	price: number;
	vat_rate: number;
	discount?: DiscountSnapshot | null;
	options?: ProductOptionSnapshot[] | null;
	notes?: string | null;
};

export type OrderCreateInput = {
	client_id: number;
	currency: string;
	/** Rate to the base currency, following `order_product.exchange_rate`. */
	exchange_rate: number;
	lines: readonly OrderLineInput[];
	type?: OrderType;
	notes?: string | null;
	/** Defaults to now. Injectable so a backdated import states its own date. */
	issued_at?: Date;
};

export class OrderService {
	constructor(private repository: ReturnType<typeof getOrderRepository>) {}

	/**
	 * Raises an order and its lines.
	 *
	 * **Takes the caller's `EntityManager` rather than opening its own transaction.** The series
	 * number is allocated inside it, so an order that fails to write rolls the counter back with
	 * itself and the `ORD` series stays gapless - and whatever the caller does in the same
	 * transaction (a cart flipping to `converted`, a subscription recording its renewal) commits
	 * or fails together with the document it produced. An inner transaction would commit the order
	 * before the caller's own write had a chance to fail.
	 *
	 * Starts at `pending`, never `draft`: a document raised from a completed checkout has been
	 * committed to by the customer. `draft` is for an order somebody is still composing in the
	 * back office.
	 */
	public async create(
		manager: EntityManager,
		data: OrderCreateInput,
	): Promise<OrderEntity> {
		if (data.lines.length === 0) {
			throw new BadRequestError(lang('order.error.no_lines'));
		}

		const reference = await documentSeriesService.allocate(
			manager,
			DocumentTypeEnum.ORDER,
		);

		const order = await manager.save(
			manager.create(OrderEntity, {
				client_id: data.client_id,
				ref_code: reference.code,
				ref_number: reference.number,
				status: OrderStatusEnum.PENDING,
				type: data.type ?? OrderTypeEnum.STANDARD,
				issued_at: data.issued_at ?? new Date(),
				notes: data.notes ?? null,
			}),
		);

		const lines = data.lines.map((line) =>
			manager.create(OrderProductEntity, <Partial<OrderProductEntity>>{
				order_id: order.id,
				// Null on every line raised this way. `parent_id` is set only when a bundle is
				// exploded into the components that carry its money, which is a shape no
				// caller produces yet.
				parent_id: null,
				variant_id: line.variant_id,
				product_id: line.product_id,
				quantity: line.quantity,
				vat_rate: line.vat_rate,
				/*
				 * The unit price the line was quoted at, with the discount recorded beside it
				 * as a snapshot rather than folded into the figure - so an invoice can show
				 * what was taken off and why, and the arithmetic stays checkable years later
				 * against a promotion that has since been withdrawn.
				 */
				price: line.price,
				currency: data.currency,
				exchange_rate: data.exchange_rate,
				discount: line.discount ? [line.discount] : null,
				options:
					line.options && line.options.length > 0
						? line.options
						: null,
				notes: line.notes ?? null,
			}),
		);

		// One statement for the whole document rather than a save per line: they are written
		// together or not at all, and a basket of twenty is twenty round trips otherwise.
		await manager.save(lines);

		return order;
	}

	/**
	 * Moves an order along its lifecycle, refusing anything `STATUS_TRANSITIONS` does not allow -
	 * a repeat of the current status answers 400, an illegal move 409.
	 *
	 * The cache is dropped after the write rather than by a subscriber: `OrderEntity.HAS_CACHE` is
	 * true, and a subscriber would fire inside the transaction, where a concurrent reader can
	 * refill the cache from a snapshot about to be superseded.
	 */
	public async updateStatus(
		entry: OrderEntity,
		newStatus: OrderStatus,
	): Promise<OrderEntity> {
		assertValidStatusTransition(
			STATUS_TRANSITIONS,
			entry.status,
			newStatus,
		);

		entry.status = newStatus;

		const saved = await this.repository.save(entry);

		await cleanEntityCache(OrderEntity, saved.id);

		return saved;
	}

	public async findById(
		id: number,
		withDeleted = false,
	): Promise<OrderEntity> {
		return this.repository
			.createQuery()
			.withDeleted(withDeleted)
			.filterById(id)
			.firstOrFail();
	}
}

export const orderService = new OrderService(getOrderRepository());

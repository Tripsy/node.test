import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import type { DiscountSnapshot } from '@/features/discount/discount.entity';
import OrderEntity from '@/features/order/order.entity';
import ProductEntity from '@/features/product/product.entity';

@Entity({
	name: 'order_product',
	schema: 'public',
	comment: 'Stores ordered products (order line items)',
})
export default class OrderProductEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	@Index('IDX_order_product_order_id')
	order_id!: number;

	@Column('bigint', { nullable: false })
	@Index('IDX_order_product_product_id')
	product_id!: number;

	@Column('numeric', { precision: 12, scale: 2, nullable: false })
	quantity!: number;

	// COST RELATED
	@Column('decimal', { precision: 5, scale: 2, nullable: false })
	vat_rate!: number;

	@Column('decimal', { precision: 12, scale: 2, nullable: false })
	price!: number;

	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
		comment: 'Currency is specific to client',
	})
	currency!: string;

	@Column('decimal', {
		precision: 10,
		scale: 6,
		nullable: false,
		default: 1,
		comment:
			'Exchange rate to invoice base currency (default 1 = same currency)',
	})
	exchange_rate!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Array of discount snapshots applied to this product line',
	})
	discount?: DiscountSnapshot[];

	@Column('text', { nullable: true })
	notes!: string | null;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => OrderEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'order_id' })
	order!: OrderEntity;

	@ManyToOne(() => ProductEntity, {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;
}

import {
	Column,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import type { EntityContextData } from '@/abstracts/entity.abstract';
import OrderProductEntity from '@/features/order/order-product.entity';
import OrderShippingEntity from '@/features/order/order-shipping.entity';

@Entity({
	name: 'order_product_shipping',
	schema: 'public',
	comment: 'Allocation of ordered products to specific shipments',
})
export default class OrderProductShippingEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column('bigint', { nullable: false })
	@Index('IDX_order_product_shipping_product_id')
	order_product_id!: number;

	@ManyToOne(
		() => OrderProductEntity,
		(item) => item.id,
		{ onDelete: 'CASCADE' },
	)
	order_product!: OrderProductEntity;

	@Column('bigint', { nullable: false })
	@Index('IDX_order_product_shipping_shipping_id')
	order_shipping_id!: number;

	@ManyToOne(
		() => OrderShippingEntity,
		(shipping) => shipping.id,
		{ onDelete: 'CASCADE' },
	)
	order_shipping!: OrderShippingEntity;

	@Column('numeric', { precision: 12, scale: 2, nullable: false })
	quantity!: number;

	@Column('text', { nullable: true })
	notes!: string | null;

	// Virtual
	contextData?: EntityContextData;
}

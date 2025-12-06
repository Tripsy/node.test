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
	name: 'order_shipping_product',
	schema: 'public',
	comment: 'Allocation of ordered products to specific shipments',
})
@Index(
	'IDX_order_shipping_product_unique',
	['order_shipping_id', 'order_product_id'],
	{
		unique: true,
	},
)
export default class OrderShippingProductEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column('bigint', { nullable: false })
	@Index('IDX_order_shipping_product_order_product_id')
	order_product_id!: number;

	@Column('bigint', { nullable: false })
	order_shipping_id!: number;

	@Column('numeric', { precision: 12, scale: 2, nullable: false })
	quantity!: number;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => OrderProductEntity, {
		onDelete: 'RESTRICT',
	})
	order_product!: OrderProductEntity;

	@ManyToOne(() => OrderShippingEntity, {
		onDelete: 'RESTRICT',
	})
	order_shipping!: OrderShippingEntity;
}

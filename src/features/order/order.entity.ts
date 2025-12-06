import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import ClientEntity from '@/features/client/client.entity';
import OrderInvoiceEntity from '@/features/order/order-invoice.entity';
import OrderProductEntity from '@/features/order/order-product.entity';
import OrderShippingEntity from '@/features/order/order-shipping.entity';

export enum OrderStatusEnum {
	DRAFT = 'draft',
	PENDING = 'pending',
	CONFIRMED = 'confirmed',
	COMPLETED = 'completed',
	CANCELLED = 'cancelled',
}

@Entity({
	name: 'order',
	schema: 'public',
	comment: 'Stores order information',
})
export default class OrderEntity extends EntityAbstract {
	@Column('varchar', { nullable: false, unique: true })
	@Index('IDX_order_client_ref', { unique: true })
	client_ref!: string;

	@Column('bigint', { nullable: false })
	@Index('IDX_order_client_id')
	client_id!: number;

	@Index('IDX_order_status')
	@Column({
		type: 'enum',
		enum: OrderStatusEnum,
		default: OrderStatusEnum.DRAFT,
		nullable: false,
	})
	status!: OrderStatusEnum;

	@Index('IDX_order_issued_at')
	@Column({ type: 'timestamp', nullable: false })
	issued_at!: Date;

	@Column('text', { nullable: true })
	notes!: string | null;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => ClientEntity, {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'client_id' })
	client!: ClientEntity;

	@OneToMany(
		() => OrderProductEntity,
		(orderProduct) => orderProduct.order,
	)
	order_products?: OrderProductEntity[];

	@OneToMany(
		() => OrderShippingEntity,
		(orderShipping) => orderShipping.order,
	)
	order_shipments?: OrderShippingEntity[];

	@OneToMany(
		() => OrderInvoiceEntity,
		(orderInvoice) => orderInvoice.order,
	)
	order_invoices?: OrderInvoiceEntity[];
}

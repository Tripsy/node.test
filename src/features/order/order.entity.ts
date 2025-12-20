import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';
import type ClientEntity from '@/features/client/client.entity';
import type InvoiceEntity from '@/features/invoice/invoice.entity';
import type OrderProductEntity from '@/features/order/order-product.entity';
import type OrderShippingEntity from '@/features/order-shipping/order-shipping.entity';

export enum OrderStatusEnum {
	DRAFT = 'draft',
	PENDING = 'pending',
	CONFIRMED = 'confirmed',
	COMPLETED = 'completed',
	CANCELLED = 'cancelled',
}

export enum OrderTypeEnum {
	STANDARD = 'standard',
	SUBSCRIPTION = 'subscription',
}

@Entity({
	name: 'order',
	schema: 'public',
	comment: 'Stores order information',
})
export default class OrderEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	@Index('IDX_order_client_id')
	client_id!: number;

	@Column('varchar', { nullable: false, unique: true })
	@Index('IDX_order_ref_number')
	ref_number!: string;

	@Column({
		type: 'enum',
		enum: OrderStatusEnum,
		default: OrderStatusEnum.DRAFT,
		nullable: false,
	})
	@Index('IDX_order_status')
	status!: OrderStatusEnum;

	@Column({
		type: 'enum',
		enum: OrderTypeEnum,
		default: OrderTypeEnum.STANDARD,
		nullable: false,
	})
	type!: OrderTypeEnum;

	@Column({ type: 'timestamp', nullable: false })
	@Index('IDX_order_issued_at')
	issued_at!: Date;

	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('ClientEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'client_id' })
	client!: ClientEntity;

	@OneToMany('OrderProductEntity',
		(orderProduct: OrderProductEntity) => orderProduct.order,
	)
	order_products?: OrderProductEntity[];

	@OneToMany('OrderShippingEntity',
		(orderShipping: OrderShippingEntity) => orderShipping.order,
	)
	order_shipments?: OrderShippingEntity[];

	@OneToMany('InvoiceEntity',
		(orderInvoice: InvoiceEntity) => orderInvoice.order,
	)
	order_invoices?: InvoiceEntity[];
}

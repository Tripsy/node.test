import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import type ClientEntity from '@/features/client/client.entity';
import type OrderProductEntity from '@/features/order/order-product.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

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

const ENTITY_TABLE_NAME = 'order';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores order information',
})
export default class OrderEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
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

	@OneToMany(
		'OrderProductEntity',
		(orderProduct: OrderProductEntity) => orderProduct.order,
	)
	order_products?: OrderProductEntity[];
}

import { Column, Entity, Index, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import ClientEntity from '@/features/client/client.entity';

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

	@Column('uuid', { nullable: false })
	@Index('IDX_order_client_id')
	client_id!: string;

	@ManyToOne(
		() => ClientEntity,
		(client) => client.id,
		{
			onDelete: 'RESTRICT',
		},
	)
	client!: ClientEntity;

	@Column({
		type: 'enum',
		enum: OrderStatusEnum,
		default: OrderStatusEnum.DRAFT,
		nullable: false,
	})
	status!: OrderStatusEnum;

	@Column({ type: 'timestamp', nullable: false })
	issued_at!: Date;

	@Column('text', { nullable: true })
	notes!: string | null;

	// Virtual
	contextData?: EntityContextData;
}

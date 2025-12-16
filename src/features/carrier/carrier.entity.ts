import { Column, Entity, Index, OneToMany } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import OrderShippingEntity from '@/features/order-shipping/order-shipping.entity';

@Entity({
	name: 'carrier',
	schema: 'public',
	comment: 'Stores shipping carriers',
})
export default class CarrierEntity extends EntityAbstract {
	@Column('varchar', { nullable: false, unique: true })
	@Index('IDX_carrier_name', { unique: true })
	name!: string;

	@Column('varchar', { nullable: true })
	website!: string | null;

	@Column('varchar', { nullable: true })
	phone!: string | null;

	@Column('varchar', { nullable: true })
	email!: string | null;

	@Column('text', { nullable: true })
	notes!: string | null;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@OneToMany(
		() => OrderShippingEntity,
		(shipping) => shipping.carrier,
	)
	order_shipments?: OrderShippingEntity[];
}

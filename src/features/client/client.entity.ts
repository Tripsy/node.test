import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import OrderEntity from '@/features/order/order.entity';
import PlaceEntity from '@/features/place/place.entity';

export enum ClientStatusEnum {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	PENDING = 'pending',
}

export enum ClientTypeEnum {
	PERSON = 'person',
	COMPANY = 'company',
}

@Entity({
	name: 'client',
	schema: 'public',
	comment: 'Stores client information for persons OR companies',
})
export default class ClientEntity extends EntityAbstract {
	@Column({
		type: 'enum',
		enum: ClientTypeEnum,
		nullable: false,
	})
	client_type!: ClientTypeEnum;

	@Column({
		type: 'enum',
		enum: ClientStatusEnum,
		default: ClientStatusEnum.PENDING,
		nullable: false,
	})
	status!: ClientStatusEnum;

	// COMPANY FIELDS
	@Column('varchar', { nullable: true })
	company_name!: string | null;

	@Column('varchar', { nullable: true })
	@Index('IDX_client_cui', { unique: false })
	company_cui!: string | null;

	@Column('varchar', { nullable: true })
	company_reg_com!: string | null;

	// PERSON FIELDS
	@Column('varchar', { nullable: true })
	person_name!: string | null;

	@Column('varchar', { nullable: true, select: false })
	person_cnp!: string | null;

	// FINANCIAL FIELDS
	@Column('varchar', { nullable: true })
	iban!: string | null;

	@Column('varchar', { nullable: true })
	bank_name!: string | null;

	// CONTACT
	@Column('varchar', { nullable: true })
	contact_name!: string | null;

	@Column('varchar', { nullable: true })
	contact_email!: string | null;

	@Column('varchar', { nullable: true })
	contact_phone!: string | null;

	// ADDRESS
	@Column('bigint', { nullable: true })
	address_country!: number | null;

	@Column('bigint', { nullable: true })
	address_county!: number | null;

	@Column('bigint', { nullable: true })
	address_city!: number | null;

	@Column('text', { nullable: true })
	address_info!: string | null;

	@Column('varchar', { nullable: true })
	address_postal_code!: string | null;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@OneToMany(
		() => OrderEntity,
		(order) => order.client,
	)
	orders?: OrderEntity[];

	@ManyToOne(() => PlaceEntity, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'address_country' })
	country?: PlaceEntity | null;

	@ManyToOne(() => PlaceEntity, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'address_county' })
	county?: PlaceEntity | null;

	@ManyToOne(() => PlaceEntity, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'address_city' })
	city?: PlaceEntity | null;
}

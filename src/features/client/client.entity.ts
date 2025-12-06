import { Column, Entity, Index, OneToMany } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import OrderEntity from '@/features/order/order.entity';

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
		default: ClientStatusEnum.ACTIVE,
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
	@Column('varchar', { default: 'Romania', nullable: false })
	address_country!: string;

	@Column('varchar', { nullable: true })
	address_county!: string | null;

	@Column('varchar', { nullable: true })
	address_city!: string | null;

	@Column('varchar', { nullable: true })
	address_street!: string | null;

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
}

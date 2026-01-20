import { Column, Entity, Index } from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

const ENTITY_TABLE_NAME = 'carrier';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores shipping carriers',
})
export default class CarrierEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

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
}

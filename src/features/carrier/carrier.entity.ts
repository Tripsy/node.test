import { Column, Entity } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';

@Entity({
	name: 'carrier',
	schema: 'public',
	comment: 'Stores shipping carriers',
})
export default class CarrierEntity extends EntityAbstract {
	@Column('varchar', { nullable: false, unique: true })
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

import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';

export enum PlaceTypeEnum {
	COUNTRY = 'country',
	REGION = 'region',
	CITY = 'city',
}

@Entity({
	name: 'place',
	schema: 'public',
	comment: 'Places (countries, regions, cities)',
})
@Index('IDX_place_code_type_unique', ['code', 'type'], { unique: true })
export default class PlaceEntity extends EntityAbstract {
	@Column('bigint', { nullable: true })
	parent_id?: number; // country -> null, region -> country_id, city -> region_id or country_id

	@Column('enum', {
		enum: PlaceTypeEnum,
		default: PlaceTypeEnum.COUNTRY,
		nullable: false,
	})
	type!: PlaceTypeEnum;

	@Column('char', { length: 3, nullable: true, comment: 'Abbreviation' })
	code?: string;

	@ManyToOne(
		() => PlaceEntity,
		(place) => place.children,
		{ onDelete: 'SET NULL' },
	)
	@JoinColumn({ name: 'parent_id' })
	parent?: PlaceEntity;

	@OneToMany(
		() => PlaceEntity,
		(place) => place.parent,
	)
	children!: PlaceEntity[];
}

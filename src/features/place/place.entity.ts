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
import PlaceContentEntity from '@/features/place/place-content.entity';

export enum PlaceTypeEnum {
	COUNTRY = 'country',
	REGION = 'region',
	CITY = 'city',
}

export type PlaceContentInput = {
	language: string;
	name: string;
	type_label: string;
};

@Entity({
	name: 'place',
	schema: 'public',
	comment: 'Places (countries, regions, cities)',
})
export default class PlaceEntity extends EntityAbstract {
	@Column('enum', {
		enum: PlaceTypeEnum,
		default: PlaceTypeEnum.COUNTRY,
		nullable: false,
	})
	type!: PlaceTypeEnum;

	@Column('bigint', { nullable: true })
    @Index('IDX_place_parent_id')
	parent_id?: number; // country -> null, region -> country_id, city -> region_id or country_id

	@Column('varchar', { length: 3, nullable: true, comment: 'Abbreviation' })
    @Index('IDX_place_code')
	code?: string;

	@ManyToOne(
		() => PlaceEntity,
		(place) => place.children,
		{ onDelete: 'SET NULL' },
	)
	@JoinColumn({ name: 'parent_id' })
	parent?: PlaceEntity;

	// VIRTUAL
	contextData?: EntityContextData;

	@OneToMany(
		() => PlaceEntity,
		(place) => place.parent,
	)
	children!: PlaceEntity[];

	@OneToMany(
		() => PlaceContentEntity,
		(content) => content.place,
	)
	contents!: PlaceContentEntity[];
}

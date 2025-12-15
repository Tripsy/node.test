import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import PlaceEntity from './place.entity';

@Entity({
	name: 'place_content',
	schema: 'public',
	comment: 'Language-specific content for places',
})
@Index('IDX_place_content_unique_per_lang', ['place_id', 'language'], { unique: true })
export default class PlaceContentEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	place_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('varchar', { nullable: false })
	name!: string;

	@Column('varchar', {
		nullable: false,
		comment: 'ex: Country, Region, City, Oras, Judet',
	})
	type_label!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => PlaceEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'place_id' })
	place!: PlaceEntity;
}

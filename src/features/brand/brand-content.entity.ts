import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import type BrandEntity from './brand.entity';

const ENTITY_TABLE_NAME = 'brand_content';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Language-specific content for brands (descriptions, meta)',
})
@Index('IDX_brand_content_unique_per_lang', ['brand_id', 'language'])
export default class BrandContentEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	brand_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('text', { nullable: true })
	description!: string | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'SEO metadata for brand pages.',
	})
	meta!: Record<string, number> | null;

	// RELATIONS
	@ManyToOne('BrandEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'brand_id' })
	brand!: BrandEntity;
}

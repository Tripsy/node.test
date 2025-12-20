import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';
import type BrandEntity from './brand.entity';

@Entity({
	name: 'brand_content',
	schema: 'public',
	comment: 'Language-specific content for brands (descriptions, meta)',
})
@Index('IDX_brand_content_unique_per_lang', ['brand_id', 'language'])
export default class BrandContentEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
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

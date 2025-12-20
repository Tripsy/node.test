import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';
import type CategoryEntity from './category.entity';

@Entity({
	name: 'category_content',
	schema: 'public',
	comment: 'Language-specific category content (slug, description, metadata)',
})
@Index('IDX_category_content_unique', ['category_id', 'language'])
@Index('IDX_category_content_slug_lang', ['slug', 'language'], { unique: true })
export default class CategoryContentEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	category_id!: number;

	@Column('varchar', {
		length: 2,
		default: 'en',
	})
	language!: string;

	@Column('varchar', { nullable: false })
	label!: number;

    @Column('varchar', { nullable: false })
    slug!: string;

    @Column('text', { nullable: true })
    description!: string | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'SEO metadata, canonical URL, images, structured data, etc.',
	})
	meta!: Record<string, number> | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// RELATIONS
	@ManyToOne('CategoryEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'category_id' })
	category!: CategoryEntity;
}

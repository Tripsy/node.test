import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';
import TermEntity from '@/features/term/term.entity';
import CategoryEntity from './category.entity';

// TODO drop term from category
@Entity({
	name: 'category_content',
	schema: 'public',
	comment: 'Language-specific category content (slug, description, metadata)',
})
@Index('IDX_category_content_unique', ['category_id', 'language'])
export default class CategoryContentEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	category_id!: number;

	@Column('varchar', {
		length: 2,
		default: 'en',
		comment:
			'Using explicit column avoids overloading `term` for language lookups.',
	})
	language!: string;

	/**
	 * Link to term for multilingual labels
	 */
	@Column('bigint', { nullable: false })
	label_id!: number;

	@Column('bigint', { nullable: false })
	@Index('IDX_category_content_slug_id', { unique: true })
	slug_id!: number;

	@Column('bigint', { nullable: true })
	description_id!: number | null;

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
	@ManyToOne(() => CategoryEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'category_id' })
	category!: CategoryEntity;

	@ManyToOne(() => TermEntity, {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'label_id' })
	label!: TermEntity;

	@ManyToOne(() => TermEntity, {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'slug_id' })
	slug!: TermEntity;

	@ManyToOne(() => TermEntity, {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'description_id' })
	description!: TermEntity | null;
}

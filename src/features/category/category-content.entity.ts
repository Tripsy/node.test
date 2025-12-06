import { Column, Entity, Index, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import CategoryEntity from './category.entity';
import TermEntity from "@/features/term/term.entity";

@Entity({
	name: 'category_content',
	schema: 'public',
	comment: 'Language-specific category content (slug, description, metadata)',
})
@Index('IDX_category_content_unique', ['category_id', 'language'])
export default class CategoryContentEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	category_id!: number;

	@Column('char', {
		length: 3,
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

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => CategoryEntity, {
		onDelete: 'CASCADE',
	})
	category!: CategoryEntity;

    @ManyToOne(() => TermEntity, {
        onDelete: 'RESTRICT',
    })
    label!: TermEntity;

    @ManyToOne(() => TermEntity, {
        onDelete: 'RESTRICT',
    })
    slug!: TermEntity;

    @ManyToOne(() => TermEntity, {
        onDelete: 'SET NULL',
    })
    description!: TermEntity | null;
}

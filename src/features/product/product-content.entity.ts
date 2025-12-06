import { Column, Entity, Index, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import TermEntity from '@/features/term/term.entity';
import ProductEntity from './product.entity';

@Entity({
	name: 'product_content',
	schema: 'public',
	comment:
		'Language-specific content for products (name, slug, descriptions, SEO)',
})
@Index('IDX_product_content_unique_per_lang', ['product_id', 'language'])
export default class ProductContentEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	product_id!: number;

	@Column('char', {
		length: 3,
		default: 'en',
		comment:
			'Using explicit column avoids overloading `term` for language lookups.',
	})
	language!: string;

	@Column('bigint', { nullable: false })
	label_id!: number;

	@Column('bigint', { nullable: false })
	@Index('IDX_product_content_slug_id', { unique: true })
	slug_id!: number;

	@Column('bigint', { nullable: true })
	description_id!: number | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'SEO metadata for product pages.',
	})
	meta!: Record<string, number> | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => ProductEntity, {
		onDelete: 'CASCADE',
	})
	product!: ProductEntity;

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

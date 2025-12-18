import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';
import ProductEntity from './product.entity';

@Entity({
	name: 'product_content',
	schema: 'public',
	comment:
		'Language-specific content for products (name, slug, descriptions, meta)',
})
@Index('IDX_product_content_unique_per_lang', ['product_id', 'language'])
@Index('IDX_product_content_slug_lang', ['slug', 'language'], { unique: true })
export default class ProductContentEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	product_id!: number;

	@Column('varchar', {
		length: 3,
		nullable: false,
		default: 'en',
	})
	language!: string;

	@Column('varchar', { nullable: false })
	label!: string;

	@Column('varchar', { nullable: false })
	slug!: string;

	@Column('text', { nullable: true })
	description!: string | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'SEO metadata for product pages.',
	})
	meta!: Record<string, number> | null;

	// RELATIONS
	@ManyToOne(() => ProductEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;
}

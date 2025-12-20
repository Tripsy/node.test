import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type CategoryEntity from '@/features/category/category.entity';
import type ProductEntity from '@/features/product/product.entity';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';

@Entity({
	name: 'product_category',
	schema: 'public',
	comment: 'Links products to categories (multilingual via term)',
})
@Index('IDX_product_category_unique', ['product_id', 'category_id'], {
	unique: true,
})
export default class ProductCategoryEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	product_id!: number;

	@Column('bigint', { nullable: false })
	@Index('IDX_product_category_category_id')
	category_id!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	@ManyToOne('CategoryEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'category_id' })
	category!: CategoryEntity;
}

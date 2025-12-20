import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductEntity from '@/features/product/product.entity';
import type TermEntity from '@/features/term/term.entity';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';

@Entity({
	name: 'product_attribute',
	schema: 'public',
	comment: 'Key/value attributes for products, using multilingual terms',
})
@Index(
	'IDX_product_attribute_unique',
	['product_id', 'attribute_label_id', 'attribute_value_id'],
	{
		unique: true,
	},
)
export default class ProductAttributeEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	@Index('IDX_product_attribute_product_id')
	product_id!: number;

	@Column('bigint', { nullable: false })
	attribute_label_id!: number;

	@Column('bigint', { nullable: false })
	attribute_value_id!: number;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	@ManyToOne('TermEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'attribute_label_id' })
	attribute_label!: TermEntity;

	@ManyToOne('TermEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'attribute_value_id' })
	attribute_value!: TermEntity;
}

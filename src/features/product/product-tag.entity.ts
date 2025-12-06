import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import ProductEntity from '@/features/product/product.entity';
import TermEntity from '@/features/term/term.entity';

@Entity({
	name: 'product_tag',
	schema: 'public',
	comment: 'Links products to tag terms',
})
@Index('IDX_product_tag_unique', ['product_id', 'tag_id'], {
	unique: true,
})
export default class ProductTagEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	product_id!: number;

	@Column('bigint', { nullable: false })
	@Index('IDX_product_tag_tag_id')
	tag_id!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => ProductEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	@ManyToOne(() => TermEntity, {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'tag_id' })
	tag!: TermEntity;
}

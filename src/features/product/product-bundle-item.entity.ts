import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductEntity from '@/features/product/product.entity';
import type ProductVariantEntity from '@/features/product/product-variant.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'product_bundle_item';

/**
 * A component of a bundle, always included: the cheeseburger that is simply part of the burger
 * menu. A bundle is a flat list of these, and `product_id` names the bundle it belongs to.
 *
 * There is no notion of a component the customer chooses between. `product_option_group` still
 * expresses "ask a question and adjust the price", so what is absent is specifically an answer
 * that is itself another product — see `.claude/rules/product.md` §8.
 *
 * `variant_id` points at what is actually consumed, so stock, VAT class and cost all come from the
 * component rather than the bundle.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'A component always included in a bundle',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
// Rendering a bundle reads every component it has, in display order
@Index('IDX_product_bundle_item_product_id', ['product_id', 'position'])
// Needed for the RESTRICT check a variant delete runs against this table
@Index('IDX_product_bundle_item_variant_id', ['variant_id'])
@Check(`(quantity > 0)`)
export default class ProductBundleItemEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', {
		nullable: false,
		comment: 'The bundle this component belongs to',
	})
	product_id!: number;

	@Column('int', {
		nullable: false,
		comment:
			'The variant consumed when this component is part of the order',
	})
	variant_id!: number;

	@Column('numeric', {
		precision: 12,
		scale: 2,
		nullable: false,
		default: 1,
		comment: 'How many of the variant this component contributes',
	})
	quantity!: number;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Display order within the bundle',
	})
	position!: number;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	// RESTRICT: a bundle whose component vanished is silently incomplete, and nothing would report
	// it — better to block the delete and force the bundle to be edited first
	@ManyToOne('ProductVariantEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'variant_id' })
	variant!: ProductVariantEntity;
}

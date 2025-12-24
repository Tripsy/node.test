import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import type BrandEntity from '@/features/brand/brand.entity';
import type OrderProductEntity from '@/features/order/order-product.entity';
import type ProductAttributeEntity from '@/features/product/product-attribute.entity';
import type ProductCategoryEntity from '@/features/product/product-category.entity';
import type ProductTagEntity from '@/features/product/product-tag.entity';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';

export enum ProductWorkflowEnum {
	DRAFT = 'draft', // Initial creation
	PENDING_REVIEW = 'pending_review', // Awaiting approval
	REVISION_REQUIRED = 'revision_required', // Needs changes
	READY = 'ready', // Ready to be sold
}

export enum ProductSaleStatusEnum {
	ON_SALE = 'on_sale',
	COMING_SOON = 'coming_soon', // Updated via cron based on available_from
	SEASONAL = 'seasonal', // Updated via cron based on available_from / available_until
	DISCONTINUED = 'discontinued', // No longer manufactured
	ARCHIVED = 'archived', // Historical record only
}

export enum ProductTypeEnum {
	PHYSICAL = 'physical',
	DIGITAL = 'digital',
	SERVICE = 'service',
}

/**
 * @note: The stock status should be updated via cron job hourly
 */
export enum ProductStockEnum {
	LOW_STOCK = 'low_stock', // Stock running low
	OUT_OF_STOCK = 'out_of_stock', // Temporarily unavailable
}

const ENTITY_TABLE_NAME = 'product';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Stores core product information; textual content is saved in a product-content.entity',
})
export default class ProductEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('varchar', { nullable: false })
	@Index('IDX_product_sku', { unique: true })
	sku!: string;

	@Column('bigint', { nullable: false })
	@Index('IDX_product_brand_id')
	brand_id!: number;

	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: false,
		comment: 'Default price if not specified otherwise',
	})
	price!: number;

	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
		comment: 'Default currency for price if not specified otherwise',
	})
	currency!: string;

	@Column('decimal', {
		precision: 5,
		scale: 2,
		nullable: false,
		default: 0,
		comment: 'Default VAT rate if not specified otherwise',
	})
	vat_rate!: number;

	@Column({
		type: 'enum',
		enum: ProductWorkflowEnum,
		default: ProductWorkflowEnum.DRAFT,
		nullable: false,
	})
	@Index('IDX_product_workflow')
	workflow!: ProductWorkflowEnum;

	@Column({
		type: 'enum',
		enum: ProductSaleStatusEnum,
		default: ProductSaleStatusEnum.ON_SALE,
		nullable: false,
	})
	@Index('IDX_product_sale_status')
	sale_status!: ProductSaleStatusEnum;

	@Column({
		type: 'enum',
		enum: ProductTypeEnum,
		default: ProductTypeEnum.PHYSICAL,
		nullable: false,
	})
	type!: ProductTypeEnum;

	@Column({
		type: 'enum',
		enum: ProductStockEnum,
		nullable: true,
		comment: 'Stock status; updated via cron job',
	})
	stock_status?: ProductStockEnum | null;

	@Column('int', {
		nullable: false,
		default: 0,
		comment:
			'Available stock quantity - this is just a snapshot not the real value',
	})
	stock_qty!: number;

	@Column({ type: 'timestamp', nullable: false })
	stock_updated_at!: Date;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// RELATIONS
	@ManyToOne('BrandEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'brand_id' })
	brand?: BrandEntity;

	@OneToMany('ProductTagEntity', (tag: ProductTagEntity) => tag.product)
	tags?: ProductTagEntity[];

	@OneToMany(
		'ProductCategoryEntity',
		(productCategory: ProductCategoryEntity) => productCategory.product,
	)
	categories?: ProductCategoryEntity[];

	@OneToMany(
		'ProductAttributeEntity',
		(attribute: ProductAttributeEntity) => attribute.product,
	)
	attributes?: ProductAttributeEntity[];

	@OneToMany(
		'OrderProductEntity',
		(orderProduct: OrderProductEntity) => orderProduct.product,
	)
	order_products?: OrderProductEntity[];
}

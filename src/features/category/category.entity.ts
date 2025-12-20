import {
	Column,
	Entity,
	Index,
	OneToMany,
	Tree,
	TreeChildren,
	TreeParent,
} from 'typeorm';
import type CategoryContentEntity from '@/features/category/category-content.entity';
import type ProductCategoryEntity from '@/features/product/product-category.entity';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';

export enum CategoryStatusEnum {
	ACTIVE = 'active',
	PENDING = 'pending',
	INACTIVE = 'inactive',
}

export enum CategoryTypeEnum {
	PRODUCT = 'product',
	ARTICLE = 'article',
}

@Entity({
	name: 'category',
	schema: 'public',
	comment: 'Hierarchical product categories',
})
@Tree('closure-table')
@Index('IDX_category_type', ['type', 'status'])
export default class CategoryEntity extends EntityAbstract {
	@Column({
		type: 'enum',
		enum: CategoryStatusEnum,
		default: CategoryStatusEnum.PENDING,
		nullable: false,
	})
	status!: CategoryStatusEnum;

	@Column({
		type: 'enum',
		enum: CategoryTypeEnum,
		default: CategoryTypeEnum.PRODUCT,
		nullable: false,
		comment: 'Specifies the entity type this category belongs to',
	})
	type!: CategoryTypeEnum;

	@Column('int', {
		default: 0,
		comment: 'Sort order among siblings',
	})
	sort_order!: number;

	/**
	 * Hierarchy
	 */
	@TreeParent()
	parent!: CategoryEntity | null;

	@TreeChildren()
	children!: CategoryEntity[];

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// RELATIONS
	@OneToMany(
		'CategoryContentEntity',
		(content: CategoryContentEntity) => content.category,
	)
	contents?: CategoryContentEntity[];

	@OneToMany(
		'ProductCategoryEntity',
		(productCategory: ProductCategoryEntity) => productCategory.category,
	)
	products?: ProductCategoryEntity[];
}

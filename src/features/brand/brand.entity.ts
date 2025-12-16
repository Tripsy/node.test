import { Column, Entity, Index, OneToMany } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';
import ProductEntity from '@/features/product/product.entity';

export enum BrandStatusEnum {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
}

@Entity({
	name: 'brand',
	schema: 'public',
})
export default class BrandEntity extends EntityAbstract {
	@Column('varchar', { nullable: false })
	name!: string;

	@Column('varchar', { nullable: false })
	@Index('IDX_brand_slug', { unique: true })
	slug!: string;

	@Column({
		type: 'enum',
		enum: BrandStatusEnum,
		default: BrandStatusEnum.ACTIVE,
		nullable: false,
	})
	status!: BrandStatusEnum;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Order/position of the brand in a listing',
	})
	sort_order!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// RELATIONS
	@OneToMany(
		() => ProductEntity,
		(product) => product.brand,
	)
	products?: ProductEntity[];
}

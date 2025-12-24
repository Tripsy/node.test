import { Column, Entity, Index, OneToMany } from 'typeorm';
import type ProductEntity from '@/features/product/product.entity';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';

export enum BrandStatusEnum {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
}

const ENTITY_TABLE_NAME = 'brand';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
})
export default class BrandEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

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
	@OneToMany('ProductEntity', (product: ProductEntity) => product.brand)
	products?: ProductEntity[];
}

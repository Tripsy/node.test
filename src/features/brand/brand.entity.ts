import { Column, Entity, Index, OneToMany } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
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

	@Index('IDX_brand_slug', { unique: true })
	@Column('varchar', { nullable: false })
	slug!: string;

	@Column({
		type: 'enum',
		enum: BrandStatusEnum,
		default: BrandStatusEnum.ACTIVE,
		nullable: false,
	})
	status!: BrandStatusEnum;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@OneToMany(
		() => ProductEntity,
		(product) => product.brand,
	)
	products?: ProductEntity[];
}

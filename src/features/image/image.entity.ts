import { Column, Entity, Index } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';

export type ImageEntityType = 'product' | 'category' | 'brand';

@Entity({ name: 'image', schema: 'public' })
@Index('IDX_image_type_id', ['entity_type', 'entity_id'])
export default class ImageEntity extends EntityAbstract {
	@Column('text', {
		nullable: false,
		comment:
			'The type of entity this image belongs to (product, category, brand, etc.)',
	})
	entity_type!: ImageEntityType;

	@Column('bigint', {
		nullable: false,
		comment: 'ID of the entity this image is linked to',
	})
	entity_id!: number;

	@Index('IDX_image_unique_main', ['entity_type', 'entity_id'], {
		unique: true,
	})
	@Column('boolean', { default: false })
	is_primary!: boolean;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Order/position of the image within the entity type',
	})
	position!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// VIRTUAL
	contextData?: EntityContextData;
}

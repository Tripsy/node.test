import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import ImageEntity from './image.entity';

export type ImageFilePropsType = {
	width?: number; // pixel
	height?: number; // pixel
	size?: number; // in bytes
	mime?:
		| 'image/jpeg'
		| 'image/png'
		| 'image/gif'
		| 'image/webp'
		| 'image/svg+xml';
	name?: string;
	extension?: 'jpeg' | 'png' | 'gif' | 'webp' | 'svg';
	path?: string; // If stored locally
	url?: string;
};

export type ImageElementAttrsType = {
	alt?: string;
	title?: string;
};

@Entity({
	name: 'image_content',
	schema: 'public',
	comment: 'Language-specific content for images',
})
@Index('IDX_image_content_unique_per_lang', ['image_id', 'language'])
export default class ImageContentEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	image_id!: number;

	@Column('char', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('jsonb', {
		nullable: false,
		comment: 'Properties of the image file',
	})
	fileProps!: ImageFilePropsType;

	@Column('jsonb', {
		nullable: true,
		comment: 'HTML element attributes (alt, title, etc.)',
	})
	elementAttrs!: ImageElementAttrsType;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => ImageEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'image_id' })
	image!: ImageEntity;
}

import { Column, Entity, Index } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';

export enum TermTypeEnum {
	CATEGORY_LABEL = 'category_label',
	CATEGORY_SLUG = 'category_slug',
	TAG = 'tag',
	ATTRIBUTE_LABEL = 'attribute_label',
	ATTRIBUTE_VALUE = 'attribute_value',
	TEXT = 'text',
}

@Entity({
	name: 'term',
	schema: 'public',
	comment:
		'Multilingual taxonomy terms: categories, tags, attribute labels/values',
})
export default class TermEntity extends EntityAbstract {
	@Column({
		type: 'enum',
		enum: TermTypeEnum,
		nullable: false,
	})
	@Index('IDX_term_type')
	type!: TermTypeEnum;

	@Column('varchar', {
		length: 3,
		default: 'en',
		comment: 'ISO language code (en will the fallback for universal terms)',
	})
	language!: string;

	@Column('varchar', {
		length: 255,
		nullable: false,
		comment: 'Localized or universal term value',
	})
	value!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;
}

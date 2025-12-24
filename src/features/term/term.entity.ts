import { Column, Entity, Index } from 'typeorm';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';

export enum TermTypeEnum {
	TAG = 'tag',
	ATTRIBUTE_LABEL = 'attribute_label',
	ATTRIBUTE_VALUE = 'attribute_value',
	TEXT = 'text',
}

const ENTITY_TABLE_NAME = 'term';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Multilingual taxonomy terms: categories, tags, attribute labels/values',
})
export default class TermEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

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
	@Index('IDX_term_language')
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

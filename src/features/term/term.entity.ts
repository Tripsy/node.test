import { Column, Entity, Index, OneToMany } from 'typeorm';
import type TermContentEntity from '@/features/term/term-content.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

/**
 * What the term is for. The type is the whole of a term's identity beyond its wording, so it is
 * what every picker filters on - a list scoped to one type is the only thing that keeps an
 * attribute label out of a tag search.
 *
 * `text` is the general-purpose one, and `bundle_choice` is deliberately *not* it: a bundle's
 * choice prompts ("Choose your fries") are a small, curated set an operator picks from, and
 * offering them out of the same pool as every other free-standing string makes that pool useless
 * as a list.
 */
export const TermTypeEnum = {
	TAG: 'tag',
	ATTRIBUTE_LABEL: 'attribute_label',
	ATTRIBUTE_VALUE: 'attribute_value',
	TEXT: 'text',
	BUNDLE_CHOICE: 'bundle_choice',
} as const;

export type TermType = (typeof TermTypeEnum)[keyof typeof TermTypeEnum];

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
	type!: TermType;

	// RELATIONS
	/*
	 * The term carries no text of its own - every string lives in `term_content`, one row per
	 * language. Consumers (`product_attribute`, `product_tag`, `product_variant_attribute`) point
	 * at this id, which is language-neutral, and resolve the wording at read time.
	 */
	@OneToMany(
		'TermContentEntity',
		(content: TermContentEntity) => content.term,
	)
	contents!: TermContentEntity[];
}

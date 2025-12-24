import { Column, Entity, Index } from 'typeorm';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';

export enum TemplateTypeEnum {
	PAGE = 'page',
	EMAIL = 'email',
}

const ENTITY_TABLE_NAME = 'template';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'system',
	comment: 'Stores email & page templates',
})
@Index('IDX_label_language_type', ['label', 'language', 'type'], {
	unique: true,
})
export default class TemplateEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('varchar', { nullable: false })
	label!: string;

	@Column('varchar', {
		length: 3,
	})
	language!: string;

	@Column({
		type: 'enum',
		enum: TemplateTypeEnum,
		default: TemplateTypeEnum.PAGE,
		nullable: false,
	})
	type!: TemplateTypeEnum;

	@Column({ type: 'jsonb', nullable: false, comment: 'Template data' })
	content!: Record<string, unknown>;
}

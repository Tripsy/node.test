import { Column, Entity, Index } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';

export enum TemplateTypeEnum {
	PAGE = 'page',
	EMAIL = 'email',
}

@Entity({
	name: 'template',
	schema: 'system',
	comment: 'Stores email & page templates',
})
@Index('IDX_label_language_type', ['label', 'language', 'type'], {
	unique: true,
})
export default class TemplateEntity extends EntityAbstract {
	@Column('varchar', { nullable: false })
	label!: string;

	@Column('varchar', {
        length: 3
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

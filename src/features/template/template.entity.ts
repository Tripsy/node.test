import { Column, Entity, Index } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import { TemplateTypeEnum } from '@/features/template/template-type.enum';

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

	@Column('char', { length: 2, nullable: false })
	language!: string;

	@Column({
		type: 'enum',
		enum: TemplateTypeEnum,
		default: TemplateTypeEnum.PAGE,
		nullable: false,
	})
	type!: TemplateTypeEnum;

	@Column({ type: 'json', nullable: false, comment: 'Template data' })
	content!: Record<string, unknown>;

	// Virtual column
	contextData?: EntityContextData;
}

import {Entity, Column, Index} from 'typeorm';
import {BaseEntityAbstract} from './base-entity.abstract';
import {TemplateTypeEnum} from '../enums/template-type.enum';

@Entity('template')
@Index('IDX_label_language_type', ['label', 'language', 'type'], { unique: true })
export default class TemplateEntity extends BaseEntityAbstract {
    @Column('varchar', {nullable: false})
    label!: string

    @Column('char', {length: 2, nullable: false})
    language!: string;

    @Column({
        type: 'enum',
        enum: TemplateTypeEnum,
        default: TemplateTypeEnum.PAGE,
        nullable: false
    })
    type!: TemplateTypeEnum;

    @Column({ type: 'json', nullable: false, comment: 'Template data' })
    content?: Record<string, any>;
}

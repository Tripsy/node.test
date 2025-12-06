import {
    Entity,
    Column,
    ManyToOne,
    Index,
} from 'typeorm';
import { EntityAbstract, type EntityContextData } from '@/abstracts/entity.abstract';
import CategoryEntity from './category.entity';
import TermEntity from '@/features/term/term.entity';

@Entity({
    name: 'category_content',
    schema: 'public',
    comment: 'Language-specific category content (slug, description, metadata)',
})
@Index('IDX_category_content_unique_per_lang', ['category_id', 'language'], {
    unique: true,
})
export default class CategoryContentEntity extends EntityAbstract {
    @Column('bigint', { nullable: false })
    category_id!: number;

    @ManyToOne(() => CategoryEntity, (cat) => cat.id, {
        onDelete: 'CASCADE',
    })
    category!: CategoryEntity;

    @Column('char', {
        length: 3,
        default: 'en',
        comment: 'Using explicit column avoids overloading `term` for language lookups.',
    })
    language!: string;

    /**
     * Link to term for multilingual labels
     */
    @Column('bigint', { nullable: false })
    label_id!: number;

    @ManyToOne(() => TermEntity, (term) => term.id, {
        onDelete: 'RESTRICT',
    })
    label!: TermEntity;

    @Column('bigint', { nullable: false })
    slug_id!: number;

    @ManyToOne(() => TermEntity, (term) => term.id, {
        onDelete: 'RESTRICT',
    })
    slug!: TermEntity;

    @Column('bigint', { nullable: true })
    description_id!: number | null;

    @ManyToOne(() => TermEntity, (term) => term.id, {
        onDelete: 'SET NULL',
    })
    description!: TermEntity | null;

    @Column('jsonb', {
        nullable: true,
        comment: 'SEO metadata, canonical URL, images, structured data, etc.',
    })
    meta!: Record<string, number> | null;

    @Column('jsonb', {
        nullable: true,
        comment:
            'Reserved column for future use',
    })
    details!: Record<string, string | number | boolean>;

    contextData?: EntityContextData;
}

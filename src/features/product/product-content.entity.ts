import {
    Entity,
    Column,
    ManyToOne,
    Index,
} from 'typeorm';
import { EntityAbstract, type EntityContextData } from '@/abstracts/entity.abstract';
import ProductEntity from './product.entity';
import TermEntity from '@/features/term/term.entity';

@Entity({
    name: 'product_content',
    schema: 'public',
    comment: 'Language-specific content for products (name, slug, descriptions, SEO)',
})
@Index('IDX_product_content_unique_per_lang', ['product_id', 'language'], {
    unique: true,
})
export default class ProductContentEntity extends EntityAbstract {
    @Column('bigint', { nullable: false })
    product_id!: number;

    @ManyToOne(() => ProductEntity, (product) => product.id, {
        onDelete: 'CASCADE',
    })
    product!: ProductEntity;

    @Column('char', {
        length: 3,
        default: 'en',
        comment: 'Using explicit column avoids overloading `term` for language lookups.',
    })
    language!: string;

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
        comment: 'SEO metadata for product pages.',
    })
    meta!: Record<string, number> | null;

    @Column('jsonb', {
        nullable: true,
        comment: 'Reserved column for future use',
    })
    details!: Record<string, string | number | boolean>;

    contextData?: EntityContextData;
}

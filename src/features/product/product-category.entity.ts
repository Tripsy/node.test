import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { EntityAbstract, type EntityContextData } from '@/abstracts/entity.abstract';
import ProductEntity from '@/features/product/product.entity';
import TermEntity from '@/features/term/term.entity';

@Entity({
    name: 'product_category',
    schema: 'public',
    comment: 'Links products to categories (multilingual via term)',
})
@Index('IDX_product_category_unique', ['product_id', 'category_id'], {
    unique: true,
})
export default class ProductCategoryEntity extends EntityAbstract {
    @Column('bigint', { nullable: false })
    product_id!: number;

    @ManyToOne(() => ProductEntity, (product) => product.id, {
        onDelete: 'CASCADE',
    })
    product!: ProductEntity;

    @Column('bigint', { nullable: false })
    category_id!: number;

    @ManyToOne(() => TermEntity, (term) => term.id, {
        onDelete: 'RESTRICT',
    })
    category!: TermEntity;

    @Column('jsonb', {
        nullable: true,
        comment:
            'Reserved column for future use',
    })
    details!: Record<string, string | number | boolean>;

    contextData?: EntityContextData;
}

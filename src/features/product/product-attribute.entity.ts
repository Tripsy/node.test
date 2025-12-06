import { Column, Entity, ManyToOne } from 'typeorm';
import { EntityAbstract, type EntityContextData } from '@/abstracts/entity.abstract';
import ProductEntity from '@/features/product/product.entity';
import TermEntity from '@/features/term/term.entity';

@Entity({
    name: 'product_attribute',
    schema: 'public',
    comment: 'Key/value attributes for products, using multilingual terms',
})
export default class ProductAttributeEntity extends EntityAbstract {
    @Column('bigint', { nullable: false })
    product_id!: number;

    @ManyToOne(() => ProductEntity, (product) => product.id, {
        onDelete: 'CASCADE',
    })
    product!: ProductEntity;

    @Column('bigint', { nullable: false })
    attribute_label_id!: number;

    @ManyToOne(() => TermEntity, (term) => term.id, {
        onDelete: 'RESTRICT',
    })
    attribute_label!: TermEntity;

    @Column('bigint', { nullable: false })
    attribute_value_id!: number;

    @ManyToOne(() => TermEntity, (term) => term.id, {
        onDelete: 'RESTRICT',
    })
    attribute_value!: TermEntity;

    contextData?: EntityContextData;
}

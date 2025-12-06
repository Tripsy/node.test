import {
    Entity,
    Column,
    Tree,
    TreeChildren,
    TreeParent,
    Index,
} from 'typeorm';
import { EntityAbstract, type EntityContextData } from '@/abstracts/entity.abstract';

export enum CategoryStatusEnum {
    ACTIVE = 'active',
    PENDING = 'pending',
    INACTIVE = 'inactive',
}

export enum CategoryTypeEnum {
    PRODUCT = 'product',
    ARTICLE = 'article',
}

@Entity({
    name: 'category',
    schema: 'public',
    comment: 'Hierarchical product categories',
})
@Tree('closure-table')
@Index('IDX_category_slug_unique', ['slug'], { unique: true })
export default class CategoryEntity extends EntityAbstract {
    @Column({
        type: 'enum',
        enum: CategoryStatusEnum,
        default: CategoryStatusEnum.PENDING,
        nullable: false,
    })
    status!: CategoryStatusEnum;

    @Column({
        type: 'enum',
        enum: CategoryTypeEnum,
        default: CategoryTypeEnum.PRODUCT,
        nullable: false,
        comment: 'Specifies the entity type this category belongs to',
    })
    type!: CategoryTypeEnum;

    @Column('int', {
        default: 0,
        comment: 'Sort order among siblings',
    })
    sort_order!: number;

    /**
     * Hierarchy
     */
    @TreeParent()
    parent!: CategoryEntity | null;

    @TreeChildren()
    children!: CategoryEntity[];

    @Column('jsonb', {
        nullable: true,
        comment:
            'Reserved column for future use',
    })
    details!: Record<string, string | number | boolean>;

    contextData?: EntityContextData;
}

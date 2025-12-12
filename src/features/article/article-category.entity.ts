import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import ArticleEntity from '@/features/article/article.entity';
import CategoryEntity from '@/features/category/category.entity';

@Entity({
	name: 'article_category',
	schema: 'public',
	comment: 'Link articles to categories',
})
@Index('IDX_article_category_unique', ['article_id', 'category_id'], {
	unique: true,
})
export default class ArticleCategoryEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	article_id!: number;

	@Column('bigint', { nullable: false })
	@Index('IDX_article_category_category_id')
	category_id!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => ArticleEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'article_id' })
	article!: ArticleEntity;

	@ManyToOne(() => CategoryEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'category_id' })
	category!: CategoryEntity;
}

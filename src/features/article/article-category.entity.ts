import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ArticleEntity from '@/features/article/article.entity';
import type CategoryEntity from '@/features/category/category.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

@Entity({
	name: 'article_category',
	schema: 'public',
	comment: 'Link articles to categories',
})
@Index('IDX_article_category_unique', ['article_id', 'category_id'], {
	unique: true,
})
export default class ArticleCategoryEntity extends EntityAbstract {
	@Column('int', { nullable: false })
	article_id!: number;

	@Column('int', { nullable: false })
	@Index('IDX_article_category_category_id')
	category_id!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// RELATIONS
	@ManyToOne('ArticleEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'article_id' })
	article!: ArticleEntity;

	@ManyToOne('CategoryEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'category_id' })
	category!: CategoryEntity;
}

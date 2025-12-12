import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import ArticleCategoryEntity from '@/features/article/article-category.entity';
import ArticleTagEntity from '@/features/article/article-tag.entity';
import ArticleTrackEntity from '@/features/article/article-track.entity';

export enum ArticleStatusEnum {
	DRAFT = 'draft', // Initial creation
	PUBLISHED = 'published', // Available for display (note: in combination with show_start_at & show_end_at)
	ARCHIVED = 'archived', // Not available for display
}

export enum ArticleLayoutEnum {
	DEFAULT = 'default',
}

export enum ArticleFeaturedStatusEnum {
	NOWHERE = 'nowhere',
	HOME = 'home',
	CATEGORY = 'category',
}

@Entity({
	name: 'article',
	schema: 'public',
	comment:
		'Stores core article information; textual content is saved in article-content.entity',
})
export default class ArticleEntity extends EntityAbstract {
	@Column({
		type: 'enum',
		enum: ArticleStatusEnum,
		default: ArticleStatusEnum.DRAFT,
		nullable: false,
	})
	@Index('IDX_article_status')
	status!: ArticleStatusEnum;

	@Column('text', {
		nullable: false,
	})
	layout!: ArticleLayoutEnum;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	@Column({ type: 'timestamp', nullable: true })
	publish_at?: Date | null;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment: 'Controls when the article should be displayed',
	})
	show_start_at?: Date | null;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment: 'Controls when the article should be displayed',
	})
	show_end_at?: Date | null;

	@Column({
		type: 'enum',
		enum: ArticleFeaturedStatusEnum,
		default: ArticleFeaturedStatusEnum.NOWHERE,
		nullable: false,
	})
	featuredStatus!: ArticleFeaturedStatusEnum;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@OneToMany(
		() => ArticleTagEntity,
		(tag) => tag.article,
	)
	tags?: ArticleTagEntity[];

	@OneToMany(
		() => ArticleCategoryEntity,
		(articleCategory) => articleCategory.article,
	)
	categories?: ArticleCategoryEntity[];

	@OneToOne(
		() => ArticleTrackEntity,
		(track) => track.article,
	)
	track?: ArticleTrackEntity;
}

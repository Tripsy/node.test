import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';
import type ArticleEntity from './article.entity';

export type ArticleAuthorType = {
	name: string;
	email?: string;
	avatar?: string;
	description?: string;
};

@Entity({
	name: 'article_content',
	schema: 'public',
	comment:
		'Language-specific content for articles (title, slug, brief, content, meta)',
})
@Index('IDX_article_content_unique_per_lang', ['article_id', 'language'])
@Index('IDX_article_content_slug_lang', ['slug', 'language'], { unique: true })
export default class ArticleContentEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	article_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('varchar', { nullable: false })
	slug!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Author details',
	})
	author!: ArticleAuthorType | null;

	@Column('text', { nullable: false })
	title!: string;

	@Column('text', { nullable: true })
	brief!: string | null;

	@Column('text', { nullable: false })
	content!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	content_blocks!: Record<string, string>;

	@Column('jsonb', {
		nullable: true,
		comment: 'SEO metadata for article pages.',
	})
	meta!: Record<string, number> | null;

	// RELATIONS
	@ManyToOne('ArticleEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'article_id' })
	article!: ArticleEntity;
}

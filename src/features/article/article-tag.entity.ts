import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';
import ArticleEntity from '@/features/article/article.entity';
import TermEntity from '@/features/term/term.entity';

@Entity({
	name: 'article_tag',
	schema: 'public',
	comment: 'Links articles to tag terms',
})
@Index('IDX_article_tag_unique', ['article_id', 'tag_id'], {
	unique: true,
})
export default class ArticleTagEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	article_id!: number;

	@Column('bigint', { nullable: false })
	@Index('IDX_article_tag_tag_id')
	tag_id!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// RELATIONS
	@ManyToOne(() => ArticleEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'article_id' })
	article!: ArticleEntity;

	@ManyToOne(() => TermEntity, {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'tag_id' })
	tag!: TermEntity;
}

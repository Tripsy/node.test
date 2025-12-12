import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import ArticleEntity from './article.entity';

@Entity({
	name: 'article_content',
	schema: 'public',
	comment: 'Track article views, etc.',
})
@Index('IDX_article_track_article_id_unique', ['article_id'], { unique: true })
export default class ArticleTrackEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column('bigint', { nullable: false })
	article_id!: number;

	@Column('bigint', { nullable: false, default: 0 })
	views!: number;

	@Column('int', { nullable: true })
	reading_time_minutes?: number | null;

	// RELATIONS
	@OneToOne(() => ArticleEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'article_id' })
	article!: ArticleEntity;
}

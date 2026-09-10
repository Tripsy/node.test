import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import CommentSubscriptionEntity from '@/features/comment/comment-subscription.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class CommentSubscriptionQuery extends RepositoryAbstract<CommentSubscriptionEntity> {
	constructor(repository: Repository<CommentSubscriptionEntity>) {
		super(repository, CommentSubscriptionEntity.NAME);
	}
}

export const getCommentSubscriptionRepository = () =>
	dataSource.getRepository(CommentSubscriptionEntity).extend({
		createQuery() {
			return new CommentSubscriptionQuery(this);
		},
	});

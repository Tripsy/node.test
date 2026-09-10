import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import ReviewEntity from '@/features/review/review.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ReviewQuery extends RepositoryAbstract<ReviewEntity> {
	constructor(repository: Repository<ReviewEntity>) {
		super(repository, ReviewEntity.NAME);
	}

	/**
	 * The moderation search box, over the only free text a review carries. `ILIKE` rather than a
	 * full-text index: a moderator searches for a fragment - half a word, a product name, a phrase
	 * somebody reported - which `to_tsquery` cannot express and stemming would defeat.
	 */
	filterByTerm(term?: string | null): this {
		if (!term || term.length < Configuration.get('filter.termMinLength')) {
			return this;
		}

		this.filterBy('content', term, 'ILIKE');

		return this;
	}
}

export const getReviewRepository = () =>
	dataSource.getRepository(ReviewEntity).extend({
		createQuery() {
			return new ReviewQuery(this);
		},
	});

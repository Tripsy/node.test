import ReviewEntity from '@/features/review/review.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

/**
 * Dashboard authorization only. The public endpoints check no permission - writing a review is
 * what a buyer does - but they do require an account: `user_id` is `NOT NULL`, so a review has an
 * author by construction, and that account is the identity every public write is scoped to
 * (`ReviewQuery.filterByOwner`).
 */
export class ReviewPolicy extends PolicyAbstract {
	constructor() {
		const entity = ReviewEntity.NAME;

		super(entity);
	}
}

export const reviewPolicy = new ReviewPolicy();

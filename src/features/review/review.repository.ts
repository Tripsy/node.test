import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import ReviewEntity, {
	ReviewStatusEnum,
} from '@/features/review/review.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ReviewQuery extends RepositoryAbstract<ReviewEntity> {
	constructor(repository: Repository<ReviewEntity>) {
		super(repository, ReviewEntity.NAME);
	}

	/**
	 * The column every read of this table starts from - a review is always looked at through the
	 * product it is about, whether by a storefront, a moderator or an average.
	 */
	filterByProduct(productId?: number | null): this {
		this.filterBy('product_id', productId);

		return this;
	}

	/**
	 * "Reviews for this size", which `IDX_review_variant` serves. Rows naming no variant are out
	 * of the result rather than in it: they are opinions about the product, and a reader filtering
	 * to one variant asked for the ones that speak about it.
	 */
	filterByVariant(variantId?: number | null): this {
		this.filterBy('variant_id', variantId);

		return this;
	}

	/**
	 * Narrows to the rows the caller may speak for, which is what makes a public revision or
	 * withdrawal safe without an ownership check downstream.
	 *
	 * No guest branch, unlike `comment` and `rating`: `user_id` is `NOT NULL` here, so a review is
	 * always attached to an account and an address hash would identify nobody the row is keyed by.
	 */
	filterByOwner(userId: number): this {
		this.filterBy('user_id', userId);

		return this;
	}

	/**
	 * What a visitor may see. Only `approved` is public - every other status is either awaiting a
	 * moderator or the record of their decision.
	 */
	filterPublic(isPublic?: boolean): this {
		if (isPublic) {
			this.filterBy('status', ReviewStatusEnum.APPROVED);
		}

		return this;
	}

	/** The "4 stars and up" filter, compared against the stored average rather than the scores. */
	filterByRatingFrom(ratingFrom?: number | null): this {
		this.filterBy('rating_avg', ratingFrom, '>=');

		return this;
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

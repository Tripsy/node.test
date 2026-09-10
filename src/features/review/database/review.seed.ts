import {
	isDirectRun,
	loadIds,
	type Random,
	randomInt,
	randomPastDate,
	randomPick,
	type SeedDefinition,
	type SeedSummary,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import ProductEntity from '@/features/product/product.entity';
import ProductVariantEntity from '@/features/product/product-variant.entity';
import ReviewEntity, {
	REVIEW_RATING_DIMENSIONS,
	type ReviewRating,
	type ReviewStatus,
	ReviewStatusEnum,
} from '@/features/review/review.entity';
import { ReviewService } from '@/features/review/review.service';
import UserEntity from '@/features/user/user.entity';

/** Products to spread reviews over; enough to give a listing something to page and sort. */
const TARGET_PRODUCTS = 10;
const MIN_REVIEWS_PER_PRODUCT = 2;
const MAX_REVIEWS_PER_PRODUCT = 6;

/**
 * Skewed towards `approved`, which is what a moderated product page looks like once it has
 * settled, while still leaving a queue for the dashboard to work through.
 */
const STATUSES: readonly ReviewStatus[] = [
	ReviewStatusEnum.APPROVED,
	ReviewStatusEnum.APPROVED,
	ReviewStatusEnum.APPROVED,
	ReviewStatusEnum.PENDING,
	ReviewStatusEnum.REJECTED,
	ReviewStatusEnum.SPAM,
];

const OPENINGS: readonly string[] = [
	'Exactly what the listing described',
	'Arrived quickly and well packed',
	'Good value for what it costs',
	'Does the job, with reservations',
	'Second time ordering this one',
	'Not quite what I expected',
];

const CLOSINGS: readonly string[] = [
	'would order again.',
	'the size runs true.',
	'delivery was the best part.',
	'support answered the same day.',
	'the finish could be better.',
	'happy with it overall.',
];

/**
 * The natural key of a seeded review is the pair `UQ_review_user` rations: one live review per
 * buyer per product. The table has no unique column of its own, so `topUp` cannot be used and the
 * pair is compared against what is stored - `withDeleted` included, since a withdrawn review still
 * holds nothing but its own row and a re-run should not write a second one beside it.
 */
function reviewKey(productId: number, userId: number): string {
	return `${productId}:${userId}`;
}

/**
 * Reviews on products, written by seeded users, some of them naming the variant they bought.
 */
export const reviewSeed: SeedDefinition = {
	name: 'review',
	run: async ({ manager, random }): Promise<SeedSummary> => {
		const repository = manager.getRepository(ReviewEntity);

		const productIds = (await loadIds(manager, ProductEntity)).slice(
			0,
			TARGET_PRODUCTS,
		);
		const userIds = await loadIds(manager, UserEntity);

		if (productIds.length === 0 || userIds.length === 0) {
			return {
				entity: 'review',
				alreadyPresent: 0,
				inserted: 0,
				target: 0,
				tableTotal: await repository.count(),
			};
		}

		// The variants of the products being reviewed, so a review can name the one that was
		// bought. Keyed by product: the composite foreign key refuses a variant belonging to
		// another product, which is exactly the mistake a flat list of ids would make easy.
		const variantRows = await manager
			.getRepository(ProductVariantEntity)
			.find({
				select: { id: true, product_id: true },
				order: { id: 'ASC' },
			});

		const variantsByProduct = new Map<number, number[]>();

		for (const row of variantRows) {
			const bucket = variantsByProduct.get(row.product_id);

			if (bucket) {
				bucket.push(row.id);
			} else {
				variantsByProduct.set(row.product_id, [row.id]);
			}
		}

		const existingRows = await repository.find({
			select: { product_id: true, user_id: true },
			withDeleted: true,
		});

		const existingKeys = new Set(
			existingRows.map((row) => reviewKey(row.product_id, row.user_id)),
		);

		const candidates: Partial<ReviewEntity>[] = [];
		const pending: Partial<ReviewEntity>[] = [];

		for (const productId of productIds) {
			const reviewCount = Math.min(
				randomInt(
					random,
					MIN_REVIEWS_PER_PRODUCT,
					MAX_REVIEWS_PER_PRODUCT,
				),
				userIds.length,
			);

			for (let index = 0; index < reviewCount; index++) {
				const userId = userIds[index];

				const candidate = buildReview(
					productId,
					userId,
					variantsByProduct.get(productId) ?? [],
					// The first seeded account stands in as the moderator, so the trail
					// names somebody other than the author of the review.
					userIds[0],
					random,
				);

				candidates.push(candidate);

				const key = reviewKey(productId, userId);

				if (existingKeys.has(key)) {
					continue;
				}

				// A re-run draws the same pairs; adding the key as it is taken also stops
				// one run from proposing the same buyer twice for the same product.
				existingKeys.add(key);

				pending.push(candidate);
			}
		}

		if (pending.length > 0) {
			await repository.save(pending, { chunk: 50 });
		}

		return {
			entity: 'review',
			alreadyPresent: candidates.length - pending.length,
			inserted: pending.length,
			target: candidates.length,
			tableTotal: await repository.count(),
		};
	},
};

/**
 * A review scored on two to four dimensions, so the partly-filled case - the one `rating_avg`
 * exists to average correctly - is represented rather than assumed away.
 */
function buildRating(random: Random): ReviewRating {
	const dimensionCount = randomInt(
		random,
		2,
		REVIEW_RATING_DIMENSIONS.length,
	);
	const rating: ReviewRating = {};

	for (let index = 0; index < dimensionCount; index++) {
		// Skewed towards the positive end, which is what a reviewed product looks like in
		// practice and keeps the seeded average away from a flat 3.
		rating[REVIEW_RATING_DIMENSIONS[index]] = randomInt(random, 3, 5);
	}

	return rating;
}

function buildReview(
	productId: number,
	userId: number,
	variantIds: readonly number[],
	moderatorId: number,
	random: Random,
): Partial<ReviewEntity> {
	const status = randomPick(random, STATUSES);
	const rating = buildRating(random);
	const isModerated = status !== ReviewStatusEnum.PENDING;

	return {
		product_id: productId,
		// Two thirds of the reviews name the variant that was bought; the rest were written
		// from the product page and name none, which is the nullable half of the column.
		variant_id:
			variantIds.length > 0 && randomInt(random, 0, 2) > 0
				? randomPick(random, variantIds)
				: null,
		rating: rating,
		rating_avg: ReviewService.computeRatingAvg(rating),
		content: `${randomPick(random, OPENINGS)} - ${randomPick(random, CLOSINGS)}`,
		status: status,
		user_id: userId,
		is_pinned: false,
		is_verified: randomInt(random, 0, 2) > 0,
		// A decision has a moment and a moderator; a review nobody has looked at yet has
		// neither, and inventing them would fake an audit trail.
		moderated_at: isModerated ? randomPastDate(random, 30) : null,
		moderated_by: isModerated ? moderatorId : null,
	};
}

if (isDirectRun(import.meta.url)) {
	await runSeedFile(reviewSeed);
}

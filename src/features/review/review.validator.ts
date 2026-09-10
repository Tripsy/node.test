import { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import {
	REVIEW_RATING_DIMENSIONS,
	REVIEW_RATING_MAX,
	REVIEW_RATING_MIN,
	type ReviewRatingDimension,
	ReviewStatusEnum,
} from '@/features/review/review.entity';
import { hasAtLeastOneValue } from '@/helpers/objects.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

export const OrderByEnum = {
	ID: 'id',
	CREATED_AT: 'created_at',
	STATUS: 'status',
	RATING_AVG: 'rating_avg',
} as const;

/**
 * What a storefront may sort by. `id` and `status` are absent on purpose: the first exposes the
 * insertion order of a moderated table, the second is a column a public read never varies.
 */
export const PublicOrderByEnum = {
	CREATED_AT: 'created_at',
	RATING_AVG: 'rating_avg',
} as const;

export const REVIEW_CONTENT_MIN = 10;
export const REVIEW_CONTENT_MAX = 5000;
export const MODERATION_REASON_MAX = 255;

/** What a moderator may change on the row; status moves through `statusUpdate` instead. */
export const paramsUpdateList: string[] = [
	'content',
	'is_pinned',
	'is_verified',
];

/**
 * What the author may change. The product and the variant are what the review *is* - moving either
 * would relocate a row a product page has already been rendered around - and the moderation
 * columns are the record of a decision taken about it.
 */
export const publicParamsUpdateList: string[] = ['rating', 'content'];

const validatorMessages = [
	...sharedValidatorMessages,
	'invalid_product_id',
	'invalid_variant_id',
	'invalid_rating',
	'invalid_rating_empty',
	'invalid_rating_from',
	'invalid_content',
	'invalid_moderation_reason',
	'invalid_is_pinned',
	'invalid_is_verified',
	'invalid_term',
] as const;

export class ReviewValidator extends BaseValidator<typeof validatorMessages> {
	/**
	 * One score, out of 5 and whole.
	 *
	 * The range is checked here rather than left to `CHK_review_rating`: a constraint violation
	 * reaches the client as a masked 500, and a score out of range is exactly the kind of thing a
	 * caller can fix once told.
	 */
	private ratingDimensionSchema() {
		const message = this.getMessage('invalid_rating');

		return this.validateNumber(
			{
				invalid: message,
				only_positive: message,
				no_decimals: message,
			},
			{ required: false, onlyPositive: true, allowDecimals: 0 },
		)
			.refine(
				(value) =>
					value === undefined ||
					(value >= REVIEW_RATING_MIN && value <= REVIEW_RATING_MAX),
				{ message: message },
			)
			.optional();
	}

	/**
	 * The scores, keyed by dimension. Built from `REVIEW_RATING_DIMENSIONS` rather than written
	 * out, so the accepted keys and the ones `CHK_review_rating` allows cannot drift apart - the
	 * schema is strict, so an unknown key is a 422 here instead of a constraint violation there.
	 *
	 * At least one score is required, which is the other half of that same constraint.
	 *
	 * Returns the required shape; a schema that may be left out marks itself `.optional()` at the
	 * call site. A `required` flag here would widen the return type to a union for both branches,
	 * and every caller would then have to narrow a value the schema guarantees.
	 */
	private ratingSchema() {
		const dimension = this.ratingDimensionSchema();

		const shape = Object.fromEntries(
			REVIEW_RATING_DIMENSIONS.map((name) => [name, dimension]),
		) as Record<ReviewRatingDimension, typeof dimension>;

		const schema = z
			.strictObject(shape)
			.refine(
				(value) =>
					Object.values(value).some((score) => score !== undefined),
				{ message: this.getMessage('invalid_rating_empty') },
			);

		return schema;
	}

	private contentSchema(required: boolean) {
		const message = {
			invalid: this.getMessage('invalid_content'),
			min_chars: this.getMessage('invalid_content'),
			max_chars: this.getMessage('invalid_content'),
		};

		const options = {
			minChars: REVIEW_CONTENT_MIN,
			maxChars: REVIEW_CONTENT_MAX,
		};

		return required
			? this.validateString(message, { ...options, required: true })
			: this.validateString(message, { ...options, required: false });
	}

	private productIdSchema() {
		return this.validateId(this.getMessage('invalid_product_id'));
	}

	/**
	 * What a buyer writes. The author is never in the body - it is the account behind the request -
	 * and neither is the status, which no caller gets to choose.
	 */
	readonly create = z.object({
		product_id: this.productIdSchema(),

		/*
		 * Optional, and left out by a review written from the product page rather than from an
		 * order line. `ReviewService` is what refuses one belonging to a different product; the
		 * composite foreign key behind it would only answer as a masked 500.
		 */
		variant_id: this.validateId(this.getMessage('invalid_variant_id'), {
			required: false,
		}),

		rating: this.ratingSchema(),

		content: this.contentSchema(true),
	});

	/**
	 * The author revising their own review. Addressed by product - `UQ_review_user` allows one
	 * live review per user per product, so the path plus the caller names exactly one row and no
	 * id has to be taken from the request.
	 */
	readonly publicUpdate = z
		.object({
			product_id: this.productIdSchema(),

			rating: this.ratingSchema().optional(),

			content: this.contentSchema(false),
		})
		.refine((data) => hasAtLeastOneValue(data, publicParamsUpdateList), {
			message: this.getMessage('params_at_least_one', {
				params: publicParamsUpdateList.join(', '),
			}),
			path: ['_global'],
		});

	readonly publicDelete = z.object({
		product_id: this.productIdSchema(),
	});

	readonly publicSummary = z.object({
		product_id: this.productIdSchema(),
	});

	/**
	 * The reviews of one product as a visitor sees them. The product comes from the path, so it
	 * sits in `querySchema` rather than in `filter`.
	 *
	 * `status` is deliberately absent: a public read only ever returns approved rows, and letting
	 * the caller name a status would expose the moderation queue.
	 */
	readonly publicFind = this.validateFind({
		orderByEnum: PublicOrderByEnum,
		defaultOrderBy: PublicOrderByEnum.CREATED_AT,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.DESC,

		defaultLimit: Configuration.get('filter.limit'),
		defaultPage: 1,

		querySchema: {
			product_id: this.productIdSchema(),
		},

		filterSchema: {
			variant_id: this.validateId(this.getMessage('invalid_variant_id'), {
				required: false,
			}),
			rating_from: this.validateNumber(
				{
					invalid: this.getMessage('invalid_rating_from'),
					only_positive: this.getMessage('invalid_rating_from'),
				},
				{ required: false, onlyPositive: true, allowDecimals: 2 },
			),
		},
	});

	readonly read = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly update = z
		.object({
			id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),

			content: this.contentSchema(false),

			/*
			 * `.optional()` on top of `required: false`, which only widens the *type*:
			 * `validateBoolean` returns a schema that still rejects a missing key, so without
			 * this every partial update would have to carry both flags.
			 */
			is_pinned: this.validateBoolean(
				this.getMessage('invalid_is_pinned'),
				{ required: false },
			).optional(),

			is_verified: this.validateBoolean(
				this.getMessage('invalid_is_verified'),
				{ required: false },
			).optional(),
		})
		.refine((data) => hasAtLeastOneValue(data, paramsUpdateList), {
			message: this.getMessage('params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		});

	readonly delete = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly restore = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	/**
	 * The moderation decision. `status` arrives in the path and the reason in the body - optional,
	 * and stored as written for the audit trail rather than shown to the author.
	 */
	readonly statusUpdate = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),

		status: this.validateEnum(
			ReviewStatusEnum,
			this.getMessage('invalid_status'),
		),

		moderation_reason: this.validateString(
			{
				invalid: this.getMessage('invalid_moderation_reason'),
				max_chars: this.getMessage('invalid_moderation_reason'),
			},
			{ required: false, maxChars: MODERATION_REASON_MAX },
		),
	});

	readonly find = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.DESC,

		defaultLimit: Configuration.get('filter.limit'),
		defaultPage: 1,

		filterSchema: {
			product_id: this.validateId(this.getMessage('invalid_product_id'), {
				required: false,
			}),
			variant_id: this.validateId(this.getMessage('invalid_variant_id'), {
				required: false,
			}),
			user_id: this.validateId(
				this.getMessage('invalid_id', { name: 'user_id' }),
				{ required: false },
			),
			status: this.validateEnum(
				ReviewStatusEnum,
				this.getMessage('invalid_status'),
				{ required: false },
			),
			rating_from: this.validateNumber(
				{
					invalid: this.getMessage('invalid_rating_from'),
					only_positive: this.getMessage('invalid_rating_from'),
				},
				{ required: false, onlyPositive: true, allowDecimals: 2 },
			),
			is_pinned: this.validateBoolean(
				this.getMessage('invalid_is_pinned'),
				{ required: false },
			),
			is_verified: this.validateBoolean(
				this.getMessage('invalid_is_verified'),
				{ required: false },
			),
			term: this.validateString(this.getMessage('invalid_term'), {
				required: false,
			}),
			/*
			 * Whether soft-deleted reviews join the listing, and it defaults to off - a
			 * withdrawn review is off every page, and the dashboard asks for it only when
			 * looking for something to restore. A caller whose role does not allow deleted
			 * rows gets none whatever this says.
			 */
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

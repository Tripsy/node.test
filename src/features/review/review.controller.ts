import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import ReviewEntity from '@/features/review/review.entity';
import {
	type ReviewPolicy,
	reviewPolicy,
} from '@/features/review/review.policy';
import {
	type ReviewService,
	reviewService,
} from '@/features/review/review.service';
import { ReviewValidator } from '@/features/review/review.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The dashboard side: moderate what buyers wrote. There is no `create` here - a review is written
 * by the buyer who owns it, through `review-public.routes.ts` - so this side only ever reads a
 * review, corrects its presentation, decides on it or takes it away.
 */
class ReviewController extends BaseController {
	constructor(
		private policy: ReviewPolicy,
		private validator: ReviewValidator,
		private cache: CacheProvider,
		private reviewService: ReviewService,
	) {
		super();
	}

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const withDeleted = this.policy.allowDeleted(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			ReviewEntity.NAME,
			data.id.toString(),
			withDeleted ? 'with-deleted' : 'non-deleted',
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, () =>
			this.reviewService.getEntryData({
				id: data.id,
				withDeleted: withDeleted,
			}),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.update,
			{
				...req.body,
				id: req.params.id,
			},
			res,
		);

		const existingEntry = await this.reviewService.findById(data.id, false);

		const entry = await this.reviewService.updateData(existingEntry, data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('review.success.update'));

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.reviewService.delete(data.id);

		res.locals.output.message(lang('review.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.reviewService.restore(data.id);

		res.locals.output.message(lang('review.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.reviewService.findByFilter(
			data,
			this.policy.allowDeleted(res.locals.auth),
			// Content language, which is what names the product in the listing; response
			// messages are English either way.
			res.locals.language,
		);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: data.page,
				limit: data.limit,
				total: total,
			},
			query: data,
		});

		res.json(res.locals.output);
	});

	/**
	 * The moderation decision. `status` arrives in the path and the reason in the body, so both
	 * sources are merged - params last, so a body cannot name a different row than the path did.
	 *
	 * The decision is stamped with the authenticated caller, never with an id from the request.
	 */
	public statusUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.statusUpdate,
			{ ...req.body, ...req.params },
			res,
		);

		const existingEntry = await this.reviewService.findById(data.id, false);

		await this.reviewService.updateStatus(
			existingEntry,
			data.status,
			this.policy.getId(res.locals.auth) ?? null,
			data.moderation_reason,
		);

		res.locals.output.message(lang('review.success.status_update'));

		res.json(res.locals.output);
	});
}

export const reviewController = new ReviewController(
	reviewPolicy,
	new ReviewValidator('review'),
	cacheProvider,
	reviewService,
);

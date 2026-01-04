import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import PlaceEntity from '@/features/place/place.entity';
import { placePolicy } from '@/features/place/place.policy';
import {
	type PlaceService,
	placeService,
} from '@/features/place/place.service';
import {
	type PlaceValidator,
	type PlaceValidatorCreateDto,
	type PlaceValidatorFindDto,
	type PlaceValidatorUpdateDto,
	placeValidator,
} from '@/features/place/place.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import { BadRequestError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class PlaceController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: PlaceValidator,
		private cache: CacheProvider,
		private placeService: PlaceService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate<PlaceValidatorCreateDto>(
			this.validator.create(),
			req.body,
			res,
		);

		const entry = await this.placeService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('place.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			PlaceEntity.NAME,
			res.locals.validated.id,
			res.locals.language,
			'read',
		);

		const place = await this.cache.get(
			cacheKey,
			async () =>
				await this.placeService.getDataById(
					res.locals.validated.id,
					res.locals.language,
					this.policy.allowDeleted(res.locals.auth),
				),
		);

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(place);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate<PlaceValidatorUpdateDto>(
			this.validator.create(),
			req.body,
			res,
		);

		const place = await this.placeService.findById(
			res.locals.validated.id,
			this.policy.allowDeleted(res.locals.auth),
		);

		const isTypeChange =
			data.type !== undefined && data.type !== place.type;

		if (isTypeChange) {
			const hasChildren = await this.placeService.hasChildren(place.id);

			if (hasChildren) {
				throw new BadRequestError(
					lang('place.error.cannot_change_type_with_children'),
				);
			}
		}

		const entry = await this.placeService.updateDataWithContent(
			res.locals.validated.id,
			data,
		);

		res.locals.output.message(lang('place.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const hasChildren = await this.placeService.hasChildren(
			res.locals.validated.id,
		);

		if (hasChildren) {
			throw new BadRequestError(
				lang('place.error.cannot_delete_with_children'),
			);
		}

		await this.placeService.delete(res.locals.validated.id);

		res.locals.output.message(lang('place.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.placeService.restore(res.locals.validated.id);

		res.locals.output.message(lang('place.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate<PlaceValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

		data.filter.language = data.filter.language ?? res.locals.language;

		const [entries, total] = await this.placeService.findByFilter(
			data,
			this.policy.allowDeleted(res.locals.auth),
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
}

export function createPlaceController(deps: {
	policy: PolicyAbstract;
	validator: PlaceValidator;
	cache: CacheProvider;
	placeService: PlaceService;
}) {
	return new PlaceController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.placeService,
	);
}

export const placeController = createPlaceController({
	policy: placePolicy,
	validator: placeValidator,
	cache: cacheProvider,
	placeService: placeService,
});

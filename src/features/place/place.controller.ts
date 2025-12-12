import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';
import PlaceEntity from '@/features/place/place.entity';
import PlacePolicy from '@/features/place/place.policy';
import PlaceRepository, {
	PlaceQuery,
} from '@/features/place/place.repository';
import {
	PlaceCreateValidator,
	PlaceFindValidator,
	PlaceUpdateValidator,
	paramsUpdateList,
} from '@/features/place/place.validator';
import asyncHandler from '@/helpers/async.handler';
import { getCacheProvider } from '@/providers/cache.provider';

class PlaceController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(req);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = PlaceCreateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const place = new PlaceEntity();
		place.label = validated.data.label;
		place.scope = validated.data.scope;
		place.reason = validated.data.reason;
		place.reference = validated.data.reference ?? null;
		place.type = validated.data.type;
		place.rules = validated.data.rules;
		place.value = validated.data.value;
		place.start_at = validated.data.start_at ?? null;
		place.end_at = validated.data.end_at ?? null;
		place.notes = validated.data.notes ?? null;

		// Set `contextData` for usage in subscriber
		place.contextData = {
			auth_id: policy.getUserId(),
		};

		const entry: PlaceEntity = await PlaceRepository.save(place);

		res.output.data(entry);
		res.output.message(lang('place.success.create'));

		res.status(201).json(res.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(req);

		// Check permission (admin or operator with permission)
		policy.read();

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			PlaceQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);
		const place = await cacheProvider.get(cacheKey, async () => {
			return PlaceRepository.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();
		});

		res.output.meta(cacheProvider.isCached, 'isCached');
		res.output.data(place);

		res.json(res.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(req);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = PlaceUpdateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const place = await PlaceRepository.createQuery()
			.select(paramsUpdateList)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		const updatedEntity: Partial<PlaceEntity> = {
			id: place.id,
			...(Object.fromEntries(
				Object.entries(validated.data).filter(([key]) =>
					paramsUpdateList.includes(key as keyof PlaceEntity),
				),
			) as Partial<PlaceEntity>),
		};

		// Set `contextData` for usage in subscriber
		updatedEntity.contextData = {
			auth_id: policy.getUserId(),
		};

		await PlaceRepository.save(updatedEntity);

		res.output.message(lang('place.success.update'));
		res.output.data(updatedEntity);

		res.json(res.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(req);

		// Check permission (admin or operator with permission)
		policy.delete();

		await PlaceRepository.createQuery()
			.filterById(res.locals.validated.id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.delete();

		res.output.message(lang('place.success.delete'));

		res.json(res.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(req);

		// Check permission (admin or operator with permission)
		policy.restore();

		await PlaceRepository.createQuery()
			.filterById(res.locals.validated.id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.restore();

		res.output.message(lang('place.success.restore'));

		res.json(res.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(req);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = PlaceFindValidator.safeParse(req.query);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const [entries, total] = await PlaceRepository.createQuery()
			.filterById(validated.data.filter.id)
			.filterBy('scope', validated.data.filter.scope)
			.filterBy('reason', validated.data.filter.reason)
			.filterBy('type', validated.data.filter.type)
			.filterByRange(
				'start_at',
				validated.data.filter.start_at_start,
				validated.data.filter.start_at_end,
			)
			.filterByTerm(validated.data.filter.term)
			.withDeleted(
				policy.allowDeleted() && validated.data.filter.is_deleted,
			)
			.orderBy(validated.data.order_by, validated.data.direction)
			.pagination(validated.data.page, validated.data.limit)
			.all(true);

		res.output.data({
			entries: entries,
			pagination: {
				page: validated.data.page,
				limit: validated.data.limit,
				total: total,
			},
			query: validated.data,
		});

		res.json(res.output);
	});
}

export default new PlaceController();

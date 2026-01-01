import type { Request, Response } from 'express';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import PlaceEntity from '@/features/place/place.entity';
import PlacePolicy from '@/features/place/place.policy';
import { getPlaceRepository } from '@/features/place/place.repository';
import {
	PlaceCreateValidator,
	PlaceFindValidator,
	PlaceUpdateValidator,
	paramsUpdateList,
} from '@/features/place/place.validator';
import PlaceContentRepository from '@/features/place/place-content.repository';
import { BadRequestError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import { getCacheProvider } from '@/lib/providers/cache.provider';

class PlaceController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		this.policy.canCreate(res.locals.auth);

		// Validate against the schema
		const validated = PlaceCreateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const entry = await dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(PlaceEntity); // We use the manager -> `getPlaceRepository` is not bound to the transaction

			const entryEntity = new PlaceEntity();
			entryEntity.type = validated.data.type;
			entryEntity.code = validated.data.code;
			entryEntity.parent_id = validated.data.parent_id;

			const entrySaved = await repository.save(entryEntity);

			await PlaceContentRepository.saveContent(
				manager,
				validated.data.content,
				entrySaved.id,
			);

			return entrySaved;
		});

		res.locals.output.data(entry);
		res.locals.output.message(lang('place.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new PlacePolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		this.policy.canRead(res.locals.auth);

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			PlaceEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const place = await cacheProvider.get(cacheKey, async () => {
			const placeData = await getPlaceRepository()
				.createQuery()
				.joinAndSelect(
					'place.contents',
					'content',
					'INNER',
					'content.language = :language',
					{
						language: res.locals.language,
					},
				)
				.joinAndSelect('place.parent', 'parent', 'LEFT')
				.joinAndSelect(
					'parent.contents',
					'parentContent',
					'LEFT',
					'parentContent.language = :language',
					{
						language: res.locals.language,
					},
				)
				.filterById(res.locals.validated.id)
				.withDeleted(this.policy.allowDeleted(res.locals.auth))
				.firstOrFail();

			const content = placeData.contents?.[0];
			const parent = placeData.parent ?? null;
			const parentContent = placeData.parent?.contents?.[0] ?? null;

			return {
				language: content.language,
				id: placeData.id,
				created_at: placeData.created_at,
				updated_at: placeData.updated_at,
				deleted_at: placeData.deleted_at,
				type: placeData.type,
				type_label: content.type_label,
				code: placeData.code,
				name: content.name,
				parent: parent
					? {
							id: parent.id,
							type: parent.type,
							type_label: parentContent.type_label,
							code: parent.code,
							name: parentContent.name,
						}
					: null,
			};
		});

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(place);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		this.policy.canUpdate(res.locals.auth);

		// Validate against the schema
		const validated = PlaceUpdateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const place = await getPlaceRepository()
			.createQuery()
			.select(['type', 'code', 'parent_id'])
			.filterById(res.locals.validated.id)
			.firstOrFail();

		const isTypeChange =
			validated.data.type !== undefined &&
			validated.data.type !== place.type;

		if (isTypeChange) {
			const hasChildren = await getPlaceRepository()
				.createQuery()
				.filterBy('parent_id', place.id)
				.firstRaw();

			if (hasChildren) {
				throw new BadRequestError(
					lang('place.error.cannot_change_type_with_children'),
				);
			}
		}

		const entry = await dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(PlaceEntity); // We use the manager -> `getPlaceRepository` is not bound to the transaction

			const updatedEntity: Partial<PlaceEntity> = {
				id: place.id,
				...(Object.fromEntries(
					Object.entries(validated.data).filter(([key]) =>
						paramsUpdateList.includes(key as keyof PlaceEntity),
					),
				) as Partial<PlaceEntity>),
			};

			await repository.save(updatedEntity);

			if (validated.data.content) {
				await PlaceContentRepository.saveContent(
					manager,
					validated.data.content,
					place.id,
				);
			}

			return updatedEntity;
		});

		res.locals.output.message(lang('place.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new PlacePolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		this.policy.canDelete(res.locals.auth);

		const hasChildren = await getPlaceRepository()
			.createQuery()
			.filterBy('parent_id', res.locals.validated.id)
			.firstRaw();

		if (hasChildren) {
			throw new BadRequestError(
				lang('place.error.cannot_delete_type_with_children'),
			);
		}

		await getPlaceRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('place.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new PlacePolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		this.policy.canRestore(res.locals.auth);

		await getPlaceRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('place.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		this.policy.canFind(res.locals.auth);

		// Validate against the schema
		const validated = PlaceFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const selectedLanguage =
			validated.data.filter.language ?? res.locals.language;

		const [entries, total] = await getPlaceRepository()
			.createQuery()
			.join(
				'place.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: selectedLanguage,
				},
			)
			.join('place.parent', 'parent', 'LEFT')
			.join(
				'parent.contents',
				'parentContent',
				'LEFT',
				'parentContent.language = :language',
				{
					language: selectedLanguage,
				},
			)
			.select([
				'place.id',
				'place.type',
				'place.code',
				'place.created_at',
				'place.deleted_at',

				'content.language',
				'content.name',
				'content.type_label',

				'parent.id',
				'parent.type',
				'parent.code',

				'parentContent.name',
				'parentContent.type_label',
			])
			.filterBy('content.language', validated.data.filter.language)
			.filterByTerm(validated.data.filter.term)
			.filterBy('place.type', validated.data.filter.type)
			.withDeleted(
				this.policy.allowDeleted(res.locals.auth) &&
					validated.data.filter.is_deleted,
			)
			.orderBy(validated.data.order_by, validated.data.direction)
			.pagination(validated.data.page, validated.data.limit)
			.all(true);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: validated.data.page,
				limit: validated.data.limit,
				total: total,
			},
			query: validated.data,
		});

		res.json(res.locals.output);
	});
}

export default new PlaceController();

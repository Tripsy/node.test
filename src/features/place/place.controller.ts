import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';
import PlaceEntity from '@/features/place/place.entity';
import PlacePolicy from '@/features/place/place.policy';
import PlaceRepository, { PlaceQuery } from '@/features/place/place.repository';
import {
	PlaceCreateValidator,
	PlaceFindValidator,
	PlaceUpdateValidator,
	paramsUpdateList,
} from '@/features/place/place.validator';
import asyncHandler from '@/helpers/async.handler';
import { getCacheProvider } from '@/providers/cache.provider';
import dataSource from "@/config/data-source.config";

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

        const entry = await dataSource.transaction(async (manager) => {
            const repository = manager.getRepository(PlaceEntity);

            const entryEntity = new PlaceEntity();
            entryEntity.type = validated.data.type;
            entryEntity.code = validated.data.code;
            entryEntity.parent_id = validated.data.parent_id;

            entryEntity.contextData = {
                auth_id: policy.getUserId(),
            };

            const entrySaved = await repository.save(entryEntity);

            await PlaceRepository.saveContent(manager, entrySaved.id, validated.data.content);

            return entrySaved;
        });

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
			const placeData = await PlaceRepository.createQuery()
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
                        language: res.locals.language
                    }
                )
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();

            const content = placeData.contents?.[0];
            const parent =  placeData.parent ?? null;
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
                parent: parent ? {
                    id: parent.id,
                    type: parent.type,
                    type_label: parentContent.type_label,
                    code: parent.code,
                    name: parentContent.name,
                } : null,
            };
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
			.select([
                'type',
                'code',
                'parent_id',
            ])
			.filterById(res.locals.validated.id)
			.firstOrFail();

        const isTypeChange =
            validated.data.type !== undefined &&
            validated.data.type !== place.type;

        if (isTypeChange) {
            const hasChildren = await PlaceRepository.createQuery()
                .filterBy('parent_id', place.id)
                .firstRaw();

            if (hasChildren) {
                throw new BadRequestError(
                    lang('place.error.cannot_change_type_with_children'),
                );
            }
        }

        const entry = await dataSource.transaction(async (manager) => {
            const repository = manager.getRepository(PlaceEntity);

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

            await repository.save(updatedEntity);

            if (validated.data.content) {
                await PlaceRepository.saveContent(manager, place.id, validated.data.content);
            }

            return updatedEntity;
        });

		res.output.message(lang('place.success.update'));
		res.output.data(entry);

		res.json(res.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new PlacePolicy(req);

		// Check permission (admin or operator with permission)
		policy.delete();

        const hasChildren = await PlaceRepository.createQuery()
            .filterBy('parent_id', res.locals.validated.id)
            .firstRaw();

        if (hasChildren) {
            throw new BadRequestError(
                lang('place.error.cannot_delete_type_with_children'),
            );
        }

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

        const selectedLanguage = validated.data.filter.language ?? res.locals.language;

		const [entries, total] = await PlaceRepository.createQuery()
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
                    language: selectedLanguage
                }
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
				policy.allowDeleted() && validated.data.filter.is_deleted,
			)
			.orderBy(validated.data.order_by, validated.data.direction)
			.pagination(validated.data.page, validated.data.limit)
            .debug()
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

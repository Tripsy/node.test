import type { Request, Response } from 'express';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import CategoryEntity, {
	CategoryStatusEnum,
} from '@/features/category/category.entity';
import CategoryPolicy from '@/features/category/category.policy';
import { getCategoryRepository } from '@/features/category/category.repository';
import {
	CategoryCreateValidator,
	CategoryFindValidator,
	CategoryReadValidator,
	CategoryStatusUpdateValidator,
	CategoryUpdateValidator,
} from '@/features/category/category.validator';
import CategoryContentRepository from '@/features/category/category-content.repository';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';
import BadRequestError from '@/lib/exceptions/bad-request.error';
import CustomError from '@/lib/exceptions/custom.error';
import asyncHandler from '@/lib/helpers/async.handler';
import { getCacheProvider } from '@/lib/providers/cache.provider';

class CategoryController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CategoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = CategoryCreateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const entry = await dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(CategoryEntity); // We use the manager -> `getCategoryRepository` is not bound to the transaction

			const entryEntity = new CategoryEntity();
			entryEntity.type = validated.data.type;

			if (validated.data.parent_id) {
				const parent = await manager
					.getRepository(CategoryEntity)
					.createQueryBuilder()
					.where('id = :id', {
						id: validated.data.parent_id,
					})
					.getOne();

				if (parent) {
					if (validated.data.type !== parent.type) {
						throw new CustomError(
							400,
							lang('category.error.parent_type_invalid'),
						);
					}

					entryEntity.parent = parent;
				} else {
					throw new CustomError(
						409,
						lang('category.error.parent_not_found'),
					);
				}
			}

			const entrySaved = await repository.save(entryEntity);

			await CategoryContentRepository.saveContent(
				manager,
				validated.data.content,
				entrySaved.id,
				entrySaved.type,
			);

			return entrySaved;
		});

		res.locals.output.data(entry);
		res.locals.output.message(lang('category.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CategoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.read();

		// Validate against the schema
		const validated = CategoryReadValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			CategoryEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const category = await cacheProvider.get(cacheKey, async () => {
			const categoryEntry = await getCategoryRepository()
				.createQuery()
				.joinAndSelect(
					'category.contents',
					'content',
					'INNER',
					'content.language = :language',
					{
						language: res.locals.language,
					},
				)
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();

			const treeRepository =
				RepositoryAbstract.getTreeRepository(CategoryEntity);

			let ancestorsWithContent: CategoryEntity[] = [];
			let childrenWithContent: CategoryEntity[] = [];

			if (validated.data.with_ancestors || validated.data.with_children) {
				const ancestors =
					await treeRepository.findAncestors(categoryEntry);

				if (validated.data.with_ancestors) {
					const orderedIds = ancestors
						.filter((a) => a.id !== categoryEntry.id) // Exclude the current category
						.map((a) => a.id);

					const ancestorsWithContentData =
						await getCategoryRepository()
							.createQuery()
							.joinAndSelect(
								'category.contents',
								'content',
								'INNER',
								'content.language = :language',
								{
									language: res.locals.language,
								},
							)
							.filterBy('id', orderedIds, 'IN')
							.withDeleted(policy.allowDeleted())
							.all();

					ancestorsWithContent = orderedIds
						.map((id) =>
							ancestorsWithContentData.find((a) => a.id === id),
						)
						.filter((a): a is typeof a => a !== undefined);
				}

				if (validated.data.with_children) {
					childrenWithContent = await getCategoryRepository()
						.createQuery()
						.joinAndSelect(
							'category.contents',
							'content',
							'INNER',
							'content.language = :language',
							{
								language: res.locals.language,
							},
						)
						.filterBy('parent_id', categoryEntry.id)
						.withDeleted(policy.allowDeleted())
						.all();
				}
			}

			return {
				...categoryEntry,
				...(validated.data.with_ancestors && {
					ancestors: ancestorsWithContent,
				}),
				...(validated.data.with_children && {
					children: childrenWithContent,
				}),
			};
		});

		res.locals.output.meta(cacheProvider.isCached, 'isCached');
		res.locals.output.data(category);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CategoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = CategoryUpdateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const category = await getCategoryRepository()
			.createQuery()
			.select(['parent_id', 'type']) // `type` is required for `saveContent`
			.filterById(res.locals.validated.id)
			.firstOrFail();

		if (validated.data.parent_id) {
			if (category.parent_id === validated.data.parent_id) {
				throw new CustomError(400, lang('category.error.parent_same'));
			}

			const newParent = await getCategoryRepository()
				.createQuery()
				.filterById(validated.data.parent_id)
				.withDeleted(policy.allowDeleted())
				.first();

			if (!newParent) {
				throw new CustomError(
					409,
					lang('category.error.parent_not_found'),
				);
			}

			if (newParent.deleted_at && !category.deleted_at) {
				throw new CustomError(
					400,
					lang('category.error.parent_deleted'),
				);
			}

			if (
				newParent.status !== CategoryStatusEnum.ACTIVE &&
				category.status === CategoryStatusEnum.ACTIVE
			) {
				throw new CustomError(
					400,
					lang('category.error.parent_not_active'),
				);
			}

			if (category.type !== newParent.type) {
				throw new CustomError(
					400,
					lang('category.error.parent_type_invalid', {
						type: category.type,
					}),
				);
			}

			const treeRepository =
				RepositoryAbstract.getTreeRepository(CategoryEntity);
			const descendants = await treeRepository.findDescendants(category);

			if (descendants.some((d) => d.id === validated.data.parent_id)) {
				throw new CustomError(
					400,
					lang('category.error.parent_descendant'),
				);
			}
		}

		const entry = await dataSource.transaction(async (manager) => {
			if ('parent_id' in validated.data) {
				let flagUpdate = false;

				if (validated.data.parent_id === null) {
					category.parent = null;
					flagUpdate = true;
				} else if (validated.data.parent_id !== category.parent_id) {
					category.parent = {
						id: validated.data.parent_id,
					} as CategoryEntity;
					flagUpdate = true;
				}

				if (flagUpdate) {
					const repository = manager.getRepository(CategoryEntity); // We use the manager -> `getCategoryRepository` is not bound to the transaction

					await repository.save(category);
				}
			}

			if (validated.data.content) {
				await CategoryContentRepository.saveContent(
					manager,
					validated.data.content,
					category.id,
					category.type,
				);
			}

			return category;
		});

		res.locals.output.message(lang('category.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new CategoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.delete();

		const category = await getCategoryRepository()
			.createQuery()
			.withDeleted(true)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		if (category.deleted_at) {
			throw new CustomError(400, lang('category.error.already_deleted'));
		}

		const treeRepository =
			RepositoryAbstract.getTreeRepository(CategoryEntity);

		const descendants = await treeRepository.findDescendants(category);

		const activeDescendants = descendants.filter(
			(d) => d.id !== category.id && !d.deleted_at,
		);

		if (activeDescendants.length > 0) {
			throw new CustomError(400, lang('category.error.has_descendants'));
		}

		await getCategoryRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('category.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new CategoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.restore();

		const category = await getCategoryRepository()
			.createQuery()
			.joinAndSelect('category.parent', 'parent', 'LEFT')
			.withDeleted(true)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		if (category.deleted_at === null) {
			throw new CustomError(400, lang('category.error.not_deleted'));
		}

		if (category.parent?.deleted_at) {
			throw new CustomError(400, lang('category.error.parent_deleted'));
		}

		if (category.parent?.status !== CategoryStatusEnum.ACTIVE) {
			throw new CustomError(
				400,
				lang('category.error.parent_not_active'),
			);
		}

		await getCategoryRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('category.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CategoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = CategoryFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const selectedLanguage =
			validated.data.filter.language ?? res.locals.language;

		const [entries, total] = await getCategoryRepository()
			.createQuery()
			.join(
				'category.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: selectedLanguage,
				},
			)
			.join('category.parent', 'parent', 'LEFT')
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
				'category.id',
				'category.type',
				'category.status',
				'category.created_at',
				'category.deleted_at',

				'content.language',
				'content.label',
				'content.slug',

				'parent.id',

				'parentContent.label',
			])
			.filterBy('type', validated.data.filter.type)
			.filterBy('status', validated.data.filter.status)
			.filterByTerm(validated.data.filter.term)
			.withDeleted(
				policy.allowDeleted() && validated.data.filter.is_deleted,
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

	public statusUpdate = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CategoryPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = CategoryStatusUpdateValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		await dataSource.transaction(async (manager) => {
			const category = await manager
				.getRepository(CategoryEntity)
				.createQueryBuilder('category')
				.where('category.id = :id', {
					id: res.locals.validated.id,
				})
				.getOneOrFail();

			if (category.status === res.locals.validated.status) {
				throw new BadRequestError(
					lang('category.error.status_unchanged', {
						status: res.locals.validated.status,
					}),
				);
			}

			const repository = manager.getRepository(CategoryEntity);

			if (res.locals.validated.status === CategoryStatusEnum.INACTIVE) {
				const treeRepository =
					manager.getTreeRepository(CategoryEntity);

				const activeDescendantsData = await treeRepository
					.createDescendantsQueryBuilder(
						'category',
						'closure',
						category,
					)
					.select('category.id', 'id')
					.where('category.status = :status', {
						status: CategoryStatusEnum.ACTIVE,
					})
					.getRawMany<{ id: number }>();

				const activeDescendants = activeDescendantsData.filter(
					(d) => d.id !== category.id,
				);

				if (activeDescendants.length > 0) {
					if (!res.locals.validated.force) {
						throw new CustomError(
							400,
							lang('category.error.has_active_descendants'),
						);
					} else {
						await repository
							.createQueryBuilder()
							.update(CategoryEntity)
							.set({ status: CategoryStatusEnum.INACTIVE })
							.where('id IN (:...ids)', {
								ids: activeDescendants.map((d) => d.id),
							})
							.execute();
					}
				}
			}

			category.status = res.locals.validated.status;

			await repository.save(category);
		});

		res.locals.output.message(lang('category.success.status_update'));

		res.json(res.locals.output);
	});
}

export default new CategoryController();

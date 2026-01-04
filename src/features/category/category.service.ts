import type { EntityManager } from 'typeorm';
import type { Repository } from 'typeorm/repository/Repository';
import dataSource from '@/config/data-source.config';
import CategoryEntity from '@/features/category/category.entity';
import {
	getCategoryRepository
} from '@/features/category/category.repository';
import {
	type CategoryValidatorCreateDto,
	type CategoryValidatorFindDto,
	type CategoryValidatorUpdateDto,
} from '@/features/category/category.validator';
import CategoryContentRepository from '@/features/category/category-content.repository';
export class CategoryService {
	constructor(
		private repository: ReturnType<typeof getCategoryRepository>,
		private getScopedCategoryRepository: (
			manager?: EntityManager,
		) => Repository<CategoryEntity>,
	) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(data: CategoryValidatorCreateDto): Promise<CategoryEntity> {
		return dataSource.transaction(async (manager) => {
			const repository = this.getScopedCategoryRepository(manager);

			const entry = {
				type: data.type,
				code: data.code,
				parent_id: data.parent_id,
			};

			const entrySaved = await repository.save(entry);

			await CategoryContentRepository.saveContent(
				manager,
				data.content,
				entrySaved.id,
			);

			return entrySaved;
		});
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateDataWithContent(
		id: number,
		data: CategoryValidatorUpdateDto,
	) {
		return await dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(CategoryEntity); // We use the manager -> `getCategoryRepository` is not bound to the transaction

			const updateData = {
				...Object.fromEntries(
					paramsUpdateList
						.filter((key) => key in data)
						.map((key) => [key, data[key as keyof typeof data]]),
				),
				id,
			};

			const updatedEntity = await repository.save(updateData);

			if (data.content) {
				await CategoryContentRepository.saveContent(
					manager,
					data.content,
					id,
				);
			}

			return updatedEntity;
		});
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<CategoryEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 */
	public async getDataById(
		id: number,
		language: string,
		withDeleted: boolean,
	) {
		const data = await this.repository
			.createQuery()
			.joinAndSelect(
				'category.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: language,
				},
			)
			.joinAndSelect('category.parent', 'parent', 'LEFT')
			.joinAndSelect(
				'parent.contents',
				'parentContent',
				'LEFT',
				'parentContent.language = :language',
				{
					language: language,
				},
			)
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();

		const content = data.contents?.[0];
		const parent = data.parent ?? null;
		const parentContent = data.parent?.contents?.[0] ?? null;

		return {
			language: content.language,
			id: data.id,
			created_at: data.created_at,
			updated_at: data.updated_at,
			deleted_at: data.deleted_at,
			type: data.type,
			type_label: content.type_label,
			code: data.code,
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
	}

	public hasChildren(id: number) {
		return this.repository
			.createQuery()
			.filterBy('parent_id', id)
			.firstRaw();
	}

	public findByFilter(data: CategoryValidatorFindDto, withDeleted: boolean) {
		return this.repository
			.createQuery()
			.join(
				'category.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: data.filter.language,
				},
			)
			.join('category.parent', 'parent', 'LEFT')
			.join(
				'parent.contents',
				'parentContent',
				'LEFT',
				'parentContent.language = :language',
				{
					language: data.filter.language,
				},
			)
			.select([
				'category.id',
				'category.type',
				'category.code',
				'category.created_at',
				'category.deleted_at',

				'content.language',
				'content.name',
				'content.type_label',

				'parent.id',
				'parent.type',
				'parent.code',

				'parentContent.name',
				'parentContent.type_label',
			])
			.filterById(data.filter.id)
			.filterBy('content.language', data.filter.language)
			.filterByTerm(data.filter.term)
			.filterBy('category.type', data.filter.type)
			.withDeleted(withDeleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export function getScopedCategoryRepository(manager?: EntityManager) {
	return (manager ?? dataSource.manager).getRepository(CategoryEntity);
}

export const categoryService = new CategoryService(
	getCategoryRepository(),
	getScopedCategoryRepository,
);

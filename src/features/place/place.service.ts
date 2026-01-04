import type { EntityManager } from 'typeorm';
import type { Repository } from 'typeorm/repository/Repository';
import dataSource from '@/config/data-source.config';
import PlaceEntity from '@/features/place/place.entity';
import {
	getPlaceRepository
} from '@/features/place/place.repository';
import {
	type PlaceValidatorCreateDto,
	type PlaceValidatorFindDto,
	type PlaceValidatorUpdateDto,
	paramsUpdateList,
} from '@/features/place/place.validator';
import PlaceContentRepository from '@/features/place/place-content.repository';
export class PlaceService {
	constructor(
		private repository: ReturnType<typeof getPlaceRepository>,
		private getScopedPlaceRepository: (
			manager?: EntityManager,
		) => Repository<PlaceEntity>,
	) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(data: PlaceValidatorCreateDto): Promise<PlaceEntity> {
		return dataSource.transaction(async (manager) => {
			const repository = this.getScopedPlaceRepository(manager);

			const entry = {
				type: data.type,
				code: data.code,
				parent_id: data.parent_id,
			};

			const entrySaved = await repository.save(entry);

			await PlaceContentRepository.saveContent(
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
		data: PlaceValidatorUpdateDto,
	) {
		return await dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(PlaceEntity); // We use the manager -> `getPlaceRepository` is not bound to the transaction

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
				await PlaceContentRepository.saveContent(
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

	public findById(id: number, withDeleted: boolean): Promise<PlaceEntity> {
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
		return await this.repository
			.createQuery()
			.joinAndSelect(
				'place.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: language,
				},
			)
			.joinAndSelect('place.parent', 'parent', 'LEFT')
			.joinAndSelect(
				'parent.contents',
				'parentContent',
				'LEFT',
				'parentContent.language = :language',
				{
					language: language,
				},
			)
            .select([
                'place.id',
                'place.type',
                'place.code',
                'place.created_at',
                'place.updated_at',
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
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();

		// const content = data.contents?.[0];
		// const parent = data.parent ?? null;
		// const parentContent = data.parent?.contents?.[0] ?? null;
        //
		// return {
		// 	language: content.language,
		// 	id: data.id,
		// 	created_at: data.created_at,
		// 	updated_at: data.updated_at,
		// 	deleted_at: data.deleted_at,
		// 	type: data.type,
		// 	type_label: content.type_label,
		// 	code: data.code,
		// 	name: content.name,
		// 	parent: parent
		// 		? {
		// 				id: parent.id,
		// 				type: parent.type,
		// 				type_label: parentContent.type_label,
		// 				code: parent.code,
		// 				name: parentContent.name,
		// 			}
		// 		: null,
		// };
	}

	public hasChildren(id: number) {
		return this.repository
			.createQuery()
			.filterBy('parent_id', id)
			.firstRaw();
	}

	public findByFilter(data: PlaceValidatorFindDto, withDeleted: boolean) {
		return this.repository
			.createQuery()
			.join(
				'place.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: data.filter.language,
				},
			)
			.join('place.parent', 'parent', 'LEFT')
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
			.filterById(data.filter.id)
			.filterBy('content.language', data.filter.language)
			.filterByTerm(data.filter.term)
			.filterBy('place.type', data.filter.type)
			.withDeleted(withDeleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export function getScopedPlaceRepository(manager?: EntityManager) {
	return (manager ?? dataSource.manager).getRepository(PlaceEntity);
}

export const placeService = new PlaceService(
	getPlaceRepository(),
	getScopedPlaceRepository,
);

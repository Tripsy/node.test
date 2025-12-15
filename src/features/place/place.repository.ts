import RepositoryAbstract from '@/abstracts/repository.abstract';
import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
import PlaceEntity, {
	type PlaceContentInput,
} from '@/features/place/place.entity';
import PlaceContentEntity from '@/features/place/place-content.entity';
import {EntityManager} from "typeorm";

export class PlaceQuery extends RepositoryAbstract<PlaceEntity> {
	static entityAlias: string = 'place';

	constructor(
		repository: ReturnType<typeof dataSource.getRepository<PlaceEntity>>,
	) {
		super(repository, PlaceQuery.entityAlias);
	}

	// TODO
	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('place.id', Number(term));
			} else {
				if (term.length > (cfg('filter.termMinLength') as number)) {
					this.filterAny([
						{
							column: 'content.name',
							value: term,
							operator: 'ILIKE',
						},
					]);
				}
			}
		}

		return this;
	}
}

export const PlaceRepository = dataSource.getRepository(PlaceEntity).extend({
	createQuery() {
		return new PlaceQuery(this);
	},

	async saveContent(manager: EntityManager, place_id: number, contents: PlaceContentInput[]) {
		if (!contents.length) {
			return;
		}

		await manager
			.createQueryBuilder()
			.insert()
			.into(PlaceContentEntity)
			.values(
				contents.map((c) => ({
					place_id: place_id,
					language: c.language,
					name: c.name,
                    type_label: c.type_label,
				})),
			)
			.orUpdate(['name', 'type_label'], ['place_id', 'language'])
			.execute();
	},
});

export default PlaceRepository;

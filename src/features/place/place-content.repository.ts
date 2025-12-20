import type { EntityManager } from 'typeorm';
import dataSource from '@/config/data-source.config';
import type { PlaceContentInput } from '@/features/place/place.entity';
import PlaceContentEntity from '@/features/place/place-content.entity';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';

export class PlaceContentQuery extends RepositoryAbstract<PlaceContentEntity> {
	static entityAlias: string = 'place_content';

	constructor(
		repository: ReturnType<
			typeof dataSource.getRepository<PlaceContentEntity>
		>,
	) {
		super(repository, PlaceContentQuery.entityAlias);
	}
}

export const PlaceContentRepository = dataSource
	.getRepository(PlaceContentEntity)
	.extend({
		createQuery() {
			return new PlaceContentQuery(this);
		},

		async saveContent(
			manager: EntityManager,
			place_id: number,
			contents: PlaceContentInput[],
		) {
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

export default PlaceContentRepository;

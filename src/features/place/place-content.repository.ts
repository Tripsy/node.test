import type { EntityManager } from 'typeorm';
import type { Repository } from 'typeorm/repository/Repository';
import { getDataSource } from '@/config/data-source.config';
import type { PlaceContentInput } from '@/features/place/place.entity';
import PlaceContentEntity from '@/features/place/place-content.entity';
import RepositoryAbstract from '@/lib/abstracts/repository.abstract';

export class PlaceContentQuery extends RepositoryAbstract<PlaceContentEntity> {
	constructor(repository: Repository<PlaceContentEntity>) {
		super(repository, PlaceContentEntity.NAME);
	}
}

export const PlaceContentRepository = getDataSource()
	.getRepository(PlaceContentEntity)
	.extend({
		createQuery() {
			return new PlaceContentQuery(this);
		},

		async saveContent(
			manager: EntityManager,
			contents: PlaceContentInput[],
			place_id: number,
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

import RepositoryAbstract from '@/abstracts/repository.abstract';
import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
import ClientEntity from '@/features/client/client.entity';

export class ClientQuery extends RepositoryAbstract<ClientEntity> {
	static entityAlias: string = 'client';

	constructor(
		repository: ReturnType<typeof dataSource.getRepository<ClientEntity>>,
	) {
		super(repository, ClientQuery.entityAlias);
	}

	// TODO
	// filterByEmail(email?: string): this {
	// 	if (email) {
	// 		this.hasFilter = true;
	// 		this.filterBy('email', email);
	// 	}
	//
	// 	return this;
	// }

	// TODO
	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (term.length > (cfg('filter.termMinLength') as number)) {
					this.filterAny([
						{
							column: 'name',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'email',
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

export const ClientRepository = dataSource.getRepository(ClientEntity).extend({
	createQuery() {
		return new ClientQuery(this);
	},
});

export default ClientRepository;

import type { Repository } from 'typeorm/repository/Repository';
import { getDataSource } from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import ClientEntity, {
	type ClientIdentityData,
	ClientTypeEnum,
} from '@/features/client/client.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ClientQuery extends RepositoryAbstract<ClientEntity> {
	constructor(repository: Repository<ClientEntity>) {
		super(repository, ClientEntity.NAME);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (
					term.length >
					(Configuration.get('filter.termMinLength') as number)
				) {
					this.filterAny([
						{
							column: 'company_name',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'company_cui',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'company_reg_com',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'person_name',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'person_cnp',
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

export const getClientRepository = () =>
	getDataSource()
		.getRepository(ClientEntity)
		.extend({
			createQuery() {
				return new ClientQuery(this);
			},

			async isDuplicateIdentity(
				data: ClientIdentityData,
				excludeId?: number,
			): Promise<boolean> {
				const query = this.createQuery().filterBy(
					'client_type',
					data.client_type,
				);

				if (excludeId) {
					query.filterBy('id', excludeId, '!=');
				}

				if (data.client_type === ClientTypeEnum.COMPANY) {
					query.filterAny([
						{
							column: 'company_name',
							value: data.company_name,
							operator: '=',
						},
						{
							column: 'company_cui',
							value: data.company_cui,
							operator: '=',
						},
						{
							column: 'company_reg_com',
							value: data.company_reg_com,
							operator: '=',
						},
					]);
				} else {
					query.filterBy('person_cnp', data.person_cnp);
				}

				query.withDeleted();

				return (await query.count()) > 0;
			},
		});

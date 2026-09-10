import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import ComplaintEntity from '@/features/complaint/complaint.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ComplaintQuery extends RepositoryAbstract<ComplaintEntity> {
	constructor(repository: Repository<ComplaintEntity>) {
		super(repository, ComplaintEntity.NAME);
	}

	/**
	 * How many separate people stand behind the live complaints this query addresses.
	 *
	 * Counted by address rather than by row or by account: two accounts sharing a mailbox are one
	 * person, and one person is one complaint however many ways they file it. `LOWER` because an
	 * address is case-insensitive in its domain part and, in practice, in its local part too.
	 *
	 * An `INNER` join, so a complaint whose reporter cannot be identified does not count - one
	 * whose account has since been soft-deleted among them. Withdrawn complaints are already out:
	 * the builder excludes soft-deleted rows unless `withDeleted` asks for them.
	 */
	async countDistinctReporters(): Promise<number> {
		const row = await this.query
			.innerJoin(
				`${this.entity}.user`,
				'reporter',
				'reporter.deleted_at IS NULL',
			)
			.andWhere("COALESCE(reporter.email, '') <> ''")
			.select('COUNT(DISTINCT LOWER(reporter.email))', 'total')
			.getRawOne<{ total: string }>();

		return Number(row?.total ?? 0);
	}

	/**
	 * The moderation search box, over the only free text a complaint carries. `ILIKE` rather than
	 * a full-text index: a moderator searches for a fragment - a URL, half a word, a name - which
	 * `to_tsquery` cannot express and stemming would defeat.
	 */
	filterByTerm(term?: string | null): this {
		if (!term) {
			return this;
		}

		this.filterBy('description', term, 'ILIKE');

		return this;
	}
}

export const getComplaintRepository = () =>
	dataSource.getRepository(ComplaintEntity).extend({
		createQuery() {
			return new ComplaintQuery(this);
		},
	});

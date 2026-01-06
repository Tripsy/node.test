import { cfg } from '@/config/settings.config';
import { getCronHistoryRepository } from '@/features/cron-history/cron-history.repository';
import { createPastDate } from '@/lib/helpers';
import { loadEmailTemplate, queueEmail } from '@/lib/providers/email.provider';

// Report cron warnings in the last 7 days
export const cronWarningCount = async () => {
	const q = getCronHistoryRepository()
		.createQuery()
		.select(
			[
				'cron_history.label AS label',
				'COUNT(cron_history.id) AS countOccurrences',
				'AVG(cron_history.run_time) AS avgRunTime',
			],
			false,
		)
		.filterByRange('start_at', createPastDate(86400 * 7)) // last 7 days
		.filterBy('status', 'error')
		.groupBy('label')
		.getQuery();

	const warnings = await q.getRawMany();

	if (warnings) {
		const warningCount: number = warnings.reduce(
			(sum: number, warning) => sum + Number(warning.countOccurrences),
			0,
		);

		if (warningCount > 0) {
			const emailTemplate = await loadEmailTemplate(
				'cron-warning-count',
				cfg('app.language') as string,
			);

			emailTemplate.content.vars = {
				warningCount: warningCount,
				warnings: warnings,
				querySql: q.getSql(),
				queryParameters: JSON.stringify(q.getParameters()),
			};

			await queueEmail(emailTemplate, {
				name: cfg('app.name') as string,
				address: cfg('app.email') as string,
			});
		}
	}

	return {
		warnings: warnings,
	};
};

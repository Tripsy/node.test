import { cfg } from '@/config/settings.config';
import { getCronHistoryRepository } from '@/features/cron-history/cron-history.repository';
import { createPastDate } from '@/helpers';
import { loadEmailTemplate, queueEmail } from '@/providers/email.provider';
import type { EmailTemplate } from '@/types/template.type';

// Report cron warnings in the last 7 days
export const cronWarningCount = async () => {
	const query = getCronHistoryRepository()
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
		.groupBy('label');

	const warnings = await query.all(false, true);

	if (warnings) {
		const warningCount: number = warnings.reduce(
			(sum: number, warning) => sum + Number(warning.countOccurrences),
			0,
		);

		if (warningCount > 0) {
			const emailTemplate: EmailTemplate = await loadEmailTemplate(
				'cron-warning-count',
				cfg('app.language') as string,
			);

			emailTemplate.content.vars = {
				warningCount: warningCount,
				warnings: warnings,
				querySql: query.debugSql(),
				queryParameters: JSON.stringify(query.debugParameters()),
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

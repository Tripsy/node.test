import { Configuration } from '@/config/settings.config';
import { getCronHistoryRepository } from '@/features/cron-history/cron-history.repository';
import { createPastDate } from '@/lib/helpers';
import { loadEmailTemplate, queueEmail } from '@/lib/providers/email.provider';

// Report cron errors in the last 24 hours
export const cronErrorCount = async () => {
	const query = getCronHistoryRepository()
		.createQuery()
		.select(['id'])
		.filterByRange('start_at', createPastDate(86400)) // Last 24 hours
		.filterBy('status', 'error');

	const errorCount = await query.count();

	if (errorCount > 0) {
		const emailTemplate = await loadEmailTemplate(
			'cron-error-count',
			Configuration.get('app.language') as string,
		);

		emailTemplate.content.vars = {
			errorCount: errorCount,
			querySql: query.debugSql(),
			queryParameters: JSON.stringify(query.debugParameters()),
		};

		await queueEmail(emailTemplate, {
			name: Configuration.get('app.name') as string,
			address: Configuration.get('app.email') as string,
		});
	}

	return {
		errorCount: errorCount,
	};
};

import { cfg } from '@/config/settings.config';
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
			cfg('app.language') as string,
		);

		emailTemplate.content.vars = {
			errorCount: errorCount,
			querySql: query.debugSql(),
			queryParameters: JSON.stringify(query.debugParameters()),
		};

		await queueEmail(emailTemplate, {
			name: cfg('app.name') as string,
			address: cfg('app.email') as string,
		});
	}

	return {
		errorCount: errorCount,
	};
};

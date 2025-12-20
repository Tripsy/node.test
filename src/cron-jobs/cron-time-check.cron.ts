import dataSource from '@/config/data-source.config';
import { cfg } from '@/config/settings.config';
import { createPastDate, formatDate } from '@/lib/helpers';
import { loadEmailTemplate, queueEmail } from '@/lib/providers/email.provider';
import type { EmailTemplate } from '@/lib/types/template.type';

// Check if there are cron jobs starting at the same time in the last 24 hours
export const cronTimeCheck = async () => {
	const querySql = `
        SELECT
            ch.id, ch.label, ch.start_at
        FROM cron_history ch
                 INNER JOIN (
            SELECT
                DATE(start_at) AS day,
                TIME_FORMAT(start_at, '%H:%i') AS hour_min,
                COUNT(id) AS count
            FROM cron_history
            WHERE
                start_at >= ? AND start_at < ?
            GROUP BY
                DATE(start_at),
                TIME_FORMAT(start_at, '%H:%i')
            HAVING count > 1
        ) dup ON DATE(ch.start_at) = dup.day
            AND TIME_FORMAT(ch.start_at, '%H:%i') = dup.hour_min
        WHERE
            ch.start_at >= ? AND ch.start_at < ?
        ORDER BY
            ch.start_at
    `;

	const endDate = new Date().toISOString();
	const startDate = createPastDate(86400).toISOString();

	const queryParameters = [startDate, endDate, startDate, endDate];

	const results: {
		[key: string]: {
			date: string;
			entries: Array<{
				id: number;
				label: string;
			}>;
		};
	} = {};

	const entries = await dataSource.query(querySql, queryParameters);

	if (entries.length > 0) {
		entries.forEach(
			(entry: { id: number; label: string; start_at: Date }) => {
				const start_at = formatDate(entry.start_at) as string;

				if (!results[start_at]) {
					results[start_at] = {
						date: formatDate(entry.start_at) as string,
						entries: [],
					};
				}

				results[start_at].entries.push({
					id: entry.id,
					label: entry.label,
				});
			},
		);

		const emailTemplate: EmailTemplate = await loadEmailTemplate(
			'cron-time-check',
			cfg('app.language') as string,
		);

		emailTemplate.content.vars = {
			results: results,
			querySql: querySql,
			queryParameters: JSON.stringify(queryParameters),
		};

		await queueEmail(emailTemplate, {
			name: cfg('app.name') as string,
			address: cfg('app.email') as string,
		});
	}

	return {
		overlapping: results.length,
	};
};

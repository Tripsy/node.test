import {createPastDate, dateToString} from '../helpers/utils.helper';
import {EmailTemplate} from '../types/template.type';
import {loadEmailTemplate, queueEmail} from '../providers/email.provider';
import {cfg} from '../config/settings.config';
import dataSource from '../config/data-source.config';

// Check if there are cron jobs starting at the same time in the last 24 hours
export const cronTimeCheck = async (): Promise<{}> => {
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

    const queryParameters = [
        startDate,
        endDate,
        startDate,
        endDate,
    ];

    const results: {
        [key: string]: {
            date: string;
            entries: Array<{
                id: number;
                label: string;
            }>;
        }
    } = {};

    const entries = await dataSource.query(querySql, queryParameters);

    if (entries.length > 0) {
        entries.forEach((entry: { id: number, label: string, start_at: Date }) => {
            const start_at: string = dateToString(entry.start_at, 'YYYY-MM-DD-HH-mm');

            if (!results[start_at]) {
                results[start_at] = {
                    date: dateToString(entry.start_at, 'YYYY-MM-DD HH:mm'),
                    entries: []
                };
            }

            results[start_at].entries.push({
                id: entry.id,
                label: entry.label
            });
        })

        const emailTemplate: EmailTemplate = await loadEmailTemplate('cron-time-check', cfg('app.language'));

        await queueEmail(
            emailTemplate,
            {
                'results': results,
                'querySql': querySql,
                'queryParameters': JSON.stringify(queryParameters),
            },
            {
                name: cfg('app.name'),
                address: cfg('app.email')
            });
    }

    return {
        overlapping: results.length
    };
};
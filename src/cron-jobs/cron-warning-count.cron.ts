import CronHistoryRepository from '../repositories/cron-history.repository';
import {EmailTemplate} from '../types/template.type';
import {loadEmailTemplate, queueEmail} from '../providers/email.provider';
import {cfg} from '../config/settings.config';
import {createPastDate} from '../helpers/date.helper';

// Report cron warnings in the last 7 days
export const cronWarningCount = async (): Promise<{}> => {
    const query = CronHistoryRepository.createQuery()
        .select([
            'cron_history.label AS label',
            'COUNT(cron_history.id) AS countOccurrences',
            'AVG(cron_history.run_time) AS avgRunTime'
        ], false)
        .filterByRange('start_at', createPastDate(86400 * 7))  // last 7 days
        .filterBy('status', 'error')
        .groupBy('label');

    const warnings = await query.all(false, true);

    if (warnings) {
        const emailTemplate: EmailTemplate = await loadEmailTemplate('cron-warning-count', cfg('app.language'));

        const warningCount: number = warnings.reduce((sum: number, warning) => sum + Number(warning.countOccurrences), 0);

        if (warningCount > 0) {
            await queueEmail(
                emailTemplate,
                {
                    warningCount: warningCount,
                    warnings: warnings,
                    querySql: query.debugSql(),
                    queryParameters: JSON.stringify(query.debugParameters()),
                },
                {
                    name: cfg('app.name'),
                    address: cfg('app.email')
                });
        }
    }

    return {
        warnings: warnings
    };
};
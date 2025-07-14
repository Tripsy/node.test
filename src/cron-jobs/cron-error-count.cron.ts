import CronHistoryRepository from '../repositories/cron-history.repository';
import {EmailTemplate} from '../types/template.type';
import {loadEmailTemplate, queueEmail} from '../providers/email.provider';
import {cfg} from '../config/settings.config';
import {createPastDate} from '../helpers/date.helper';

// Report cron errors in last 24 hours
export const cronErrorCount = async (): Promise<{}> => {
    const query = CronHistoryRepository.createQuery()
        .select(['id'])
        .filterByRange('start_at', createPastDate(86400))  // Last 24 hours
        .filterBy('status', 'error');

    const errorCount = await query.count();

    if (errorCount > 0) {
        const emailTemplate: EmailTemplate = await loadEmailTemplate('cron-error-count', cfg('app.language'));

        await queueEmail(
            emailTemplate,
            {
                errorCount: errorCount,
                querySql: query.debugSql(),
                queryParameters: JSON.stringify(query.debugParameters()),
            },
            {
                name: cfg('app.name'),
                address: cfg('app.email')
            });
    }

    return {
        errorCount: errorCount
    };
};
import cron from 'node-cron';
import {cleanAccountToken} from '../cron-jobs/clean-account-token.cron';
import CronHistoryEntity from '../entities/cron-history.entity';
import {CronHistoryStatusEnum} from '../enums/cron-history-status.enum';
import CronHistoryRepository from '../repositories/cron-history.repository';
import NotFoundError from '../exceptions/not-found.error';
import logger, {childLogger} from './logger.provider';
import {cleanAccountRecovery} from '../cron-jobs/clean-account-recovery.cron';
import {workerMaintenance} from '../cron-jobs/worker-maintenance.cron';
import {Logger} from 'pino';
import {cronErrorCount} from '../cron-jobs/cron-error-count.cron';
import {cronTimeCheck} from '../cron-jobs/cron-time-check.cron';
import {cronWarningCount} from '../cron-jobs/cron-warning-count.cron';
import {LogCategoryEnum} from '../enums/log-category.enum';
import {dateDiffInSeconds} from '../helpers/date.helper';

const cronLogger: Logger = childLogger(logger, LogCategoryEnum.CRON);

/**
 * Execute cron job and save history
 *
 * @param action - Should return cron_history `content`
 * @param expectedRunTime - Expected run time in seconds
 */
async function executeCron(action: () => Promise<{}>, expectedRunTime: number) {
    const cronHistoryEntity = new CronHistoryEntity();
    cronHistoryEntity.label = action.name;
    cronHistoryEntity.start_at = new Date();

    try {
        cronHistoryEntity.content = await action();
        cronHistoryEntity.status = CronHistoryStatusEnum.OK;
    } catch (error) {
        if (error instanceof NotFoundError) {
            cronHistoryEntity.status = CronHistoryStatusEnum.OK;
            cronHistoryEntity.content = {
                removed: 0
            };
        } else if (error instanceof Error) {
            cronHistoryEntity.status = CronHistoryStatusEnum.ERROR;
            cronHistoryEntity.content = {
                message: error.message
            };

            cronLogger.error(error, error.message);
        } else {
            cronHistoryEntity.status = CronHistoryStatusEnum.ERROR;
            cronHistoryEntity.content = {
                message: 'Unknown error'
            };

            cronLogger.error(error, 'Unknown error');
        }
    } finally {
        cronHistoryEntity.end_at = new Date();
        cronHistoryEntity.run_time = dateDiffInSeconds(cronHistoryEntity.end_at, cronHistoryEntity.start_at);

        if (cronHistoryEntity.run_time > expectedRunTime && cronHistoryEntity.status !== CronHistoryStatusEnum.ERROR) {
            cronHistoryEntity.status = CronHistoryStatusEnum.WARNING;
        }

        await CronHistoryRepository.save(cronHistoryEntity);
    }
}

const startCronJobs = () => {
    // Remove expired account tokens - every 3 hours at minute 2
    cron.schedule('02 */3 * * *', async () => {
        await executeCron(cleanAccountToken, 1);
    });

    // Handle workers maintenance - every 6 hours at minute 4
    cron.schedule('04 */6 * * *', async () => {
        await executeCron(workerMaintenance, 1);
    });

    // Report cron errors in last 24 hours - every day at 02:01
    cron.schedule('01 02 * * *', async () => {
        await executeCron(cronErrorCount, 1);
    });

    // Report cron warnings in last 7 days - every 7 days at 02:02
    cron.schedule('02 02 * * *', async () => {
        await executeCron(cronWarningCount, 1);
    });

    // Check if there are cron jobs starting at the same time - every day at 02:03
    cron.schedule('03 02 * * *', async () => {
        await executeCron(cronTimeCheck, 1);
    });

    // Remove expired recovery tokens - every 7 days at 02:04
    cron.schedule('02 04 */7 * *', async () => {
        await executeCron(cleanAccountRecovery, 1);
    });
}

export default startCronJobs;
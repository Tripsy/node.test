import cron from 'node-cron';
import {cleanAccountTokenCron} from '../cron-jobs/clean-account-token.cron';
import CronHistoryEntity from '../entities/cron-history.entity';
import {CronHistoryStatusEnum} from '../enums/cron-history-status.enum';
import CronHistoryRepository from '../repositories/cron-history.repository';
import {dateDiffInSeconds} from '../helpers/utils.helper';
import NotFoundError from '../exceptions/not-found.error';
import logger, {childLogger} from './logger.provider';
import {cleanAccountRecoveryCron} from '../cron-jobs/clean-account-recovery.cron';
import {workerMaintenance} from '../cron-jobs/worker-maintenance.cron';
import {Logger} from 'pino';

const cronLogger: Logger = childLogger(logger, 'cron');

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
    cron.schedule('2 */3 * * *', async () => {
        await executeCron(cleanAccountTokenCron, 1);
    });

    // Handle workers maintenance - every 6 hours at minute 4
    cron.schedule('4 */6 * * *', async () => {
        await executeCron(workerMaintenance, 1);
    });

    // Remove expired recovery tokens - every 7 days at 03:00
    cron.schedule('0 3 */7 * *', async () => {
        await executeCron(cleanAccountRecoveryCron, 1);
    });
}

export default startCronJobs;
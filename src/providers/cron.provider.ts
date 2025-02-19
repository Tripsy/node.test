import cron from 'node-cron';
import {cleanAccountTokenCron} from '../cron-jobs/clean-account-token.cron';
import CronHistoryEntity from '../entities/cron-history.entity';
import {CronHistoryStatusEnum} from '../enums/cron-history-status.enum';
import CronHistoryRepository from '../repositories/cron-history.repository';
import {dateDiffInSeconds} from '../helpers/utils';

/**
 * @param cronHistoryEntity
 * @param expectedRunTime - Expected run time in seconds
 */
function saveCronHistory(cronHistoryEntity: CronHistoryEntity, expectedRunTime: number) {
    cronHistoryEntity.end_at = new Date();
    cronHistoryEntity.run_time = dateDiffInSeconds(cronHistoryEntity.end_at, cronHistoryEntity.start_at);

    if (cronHistoryEntity.run_time > expectedRunTime && cronHistoryEntity.status !== CronHistoryStatusEnum.ERROR) {
        cronHistoryEntity.status = CronHistoryStatusEnum.WARNING;
    }

    void CronHistoryRepository.save(cronHistoryEntity);
}

const startCronJobs = () => {
    // Remove expired account tokens - every 3 hours
    cron.schedule('* */3 * * *', async () => {
        const cronHistoryEntity = await cleanAccountTokenCron();

        cronHistoryEntity.label = 'cleanAccountTokenCron';

        saveCronHistory(cronHistoryEntity, 1);
    });
}

export default startCronJobs;
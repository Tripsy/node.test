import AccountTokenRepository from '../repositories/account-token.repository';
import {createPastDate} from '../helpers/utils';
import {cronLogger} from '../providers/logger.provider';
import NotFoundError from '../exceptions/not-found.error';
import CronHistoryEntity from '../entities/cron-history.entity';
import {CronHistoryStatusEnum} from '../enums/cron-history-status.enum';

// Remove expired account tokens
export const cleanAccountTokenCron = async (): Promise<CronHistoryEntity> => {
    const cronHistoryEntity = new CronHistoryEntity();
    cronHistoryEntity.start_at = new Date();

    try {
        const countRemoved = await AccountTokenRepository.createQuery()
            .filterByRange('expire_at', undefined, createPastDate(86400))
            .delete(false, true, true);

        cronHistoryEntity.status = CronHistoryStatusEnum.OK;
        cronHistoryEntity.content = {
            removed: countRemoved
        };
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
    }

    return cronHistoryEntity;
};
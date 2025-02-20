import dataSource from '../config/data-source.config';
import CronHistoryEntity from '../entities/cron-history.entity';
import AbstractQuery from './abstract.query';

export class CronHistoryQuery extends AbstractQuery {
    constructor(repository: ReturnType<typeof dataSource.getRepository<CronHistoryEntity>>) {
        super(repository, CronHistoryRepository.entityAlias);
    }
}

export const CronHistoryRepository = dataSource.getRepository(CronHistoryEntity).extend({
    entityAlias: 'cron_history',

    createQuery() {
        return new CronHistoryQuery(this);
    },
});

export default CronHistoryRepository;

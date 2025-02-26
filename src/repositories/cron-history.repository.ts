import dataSource from '../config/data-source.config';
import CronHistoryEntity from '../entities/cron-history.entity';
import AbstractQuery from './abstract.query';

export class CronHistoryQuery extends AbstractQuery {
    static entityAlias: string = 'cron_history';
    
    constructor(repository: ReturnType<typeof dataSource.getRepository<CronHistoryEntity>>) {
        super(repository, CronHistoryQuery.entityAlias);
    }
}

export const CronHistoryRepository = dataSource.getRepository(CronHistoryEntity).extend({
    createQuery() {
        return new CronHistoryQuery(this);
    },
});

export default CronHistoryRepository;

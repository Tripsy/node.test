import dataSource from '../config/data-source.config';
import LogDataEntity from '../entities/log-data.entity';
import AbstractQuery from './abstract.query';

export class LogDataQuery extends AbstractQuery {
    static entityAlias: string = 'log_data';
    
    constructor(repository: ReturnType<typeof dataSource.getRepository<LogDataEntity>>) {
        super(repository, LogDataQuery.entityAlias);
    }
}

export const LogDataRepository = dataSource.getRepository(LogDataEntity).extend({
    createQuery() {
        return new LogDataQuery(this);
    },
});

export default LogDataRepository;

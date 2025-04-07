import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import {CronHistoryQuery} from '../repositories/cron-history.repository';

class CronHistoryPolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = CronHistoryQuery.entityAlias;

        super(req, entity);
    }
}

export default CronHistoryPolicy;
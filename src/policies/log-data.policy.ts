import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import {LogDataQuery} from '../repositories/log-data.repository';

class LogDataPolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = LogDataQuery.entityAlias;

        super(req, entity);
    }
}

export default LogDataPolicy;
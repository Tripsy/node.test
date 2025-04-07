import {Request} from 'express';
import AbstractPolicy from './abstract.policy';
import {TemplateQuery} from '../repositories/template.repository';

class TemplatePolicy extends AbstractPolicy {
    constructor(req: Request) {
        const entity = TemplateQuery.entityAlias;

        super(req, entity);
    }
}

export default TemplatePolicy;
import dataSource from '../config/data-source.config';
import TemplateEntity from '../entities/template.entity';
import AbstractQuery from './abstract.query';

export class TemplateQuery extends AbstractQuery {
    static entityAlias: string = 'template';
    
    constructor(repository: ReturnType<typeof dataSource.getRepository<TemplateEntity>>) {
        super(repository, TemplateQuery.entityAlias);
    }
}

export const TemplateRepository = dataSource.getRepository(TemplateEntity).extend({
    createQuery() {
        return new TemplateQuery(this);
    },
});

export default TemplateRepository;

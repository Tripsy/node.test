import dataSource from '../config/data-source.config';
import TemplateEntity from '../entities/template.entity';
import AbstractQuery from './abstract.query';

export class TemplateQuery extends AbstractQuery {
    constructor(repository: ReturnType<typeof dataSource.getRepository<TemplateEntity>>) {
        super(repository, TemplateRepository.entityAlias);
    }
}

export const TemplateRepository = dataSource.getRepository(TemplateEntity).extend({
    entityAlias: 'template',

    createQuery() {
        return new TemplateQuery(this);
    },
});

export default TemplateRepository;

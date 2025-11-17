import type { Request } from 'express';
import { TemplateQuery } from '../repositories/template.repository';
import AbstractPolicy from './abstract.policy';

class TemplatePolicy extends AbstractPolicy {
	constructor(req: Request) {
		const entity = TemplateQuery.entityAlias;

		super(req, entity);
	}
}

export default TemplatePolicy;

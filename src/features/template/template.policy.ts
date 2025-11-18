import type { Request } from 'express';
import PolicyAbstract from '@/abstracts/policy.abstract';
import { TemplateQuery } from '@/features/template/template.repository';

class TemplatePolicy extends PolicyAbstract {
	constructor(req: Request) {
		const entity = TemplateQuery.entityAlias;

		super(req, entity);
	}
}

export default TemplatePolicy;

import PolicyAbstract from '@/abstracts/policy.abstract';
import { TemplateQuery } from '@/features/template/template.repository';
import type { AuthContext } from '@/types/express';

class TemplatePolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = TemplateQuery.entityAlias;

		super(auth, entity);
	}
}

export default TemplatePolicy;

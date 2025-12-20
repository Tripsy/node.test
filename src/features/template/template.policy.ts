import { TemplateQuery } from '@/features/template/template.repository';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class TemplatePolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = TemplateQuery.entityAlias;

		super(auth, entity);
	}
}

export default TemplatePolicy;

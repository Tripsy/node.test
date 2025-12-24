import TemplateEntity from '@/features/template/template.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';
import type { AuthContext } from '@/lib/types/express';

class TemplatePolicy extends PolicyAbstract {
	constructor(auth: AuthContext | undefined) {
		const entity = TemplateEntity.NAME;

		super(auth, entity);
	}
}

export default TemplatePolicy;

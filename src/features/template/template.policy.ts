import TemplateEntity from '@/features/template/template.entity';
import PolicyAbstract from '@/lib/abstracts/policy.abstract';

class TemplatePolicy extends PolicyAbstract {
	constructor() {
		const entity = TemplateEntity.NAME;

		super(entity);
	}
}

export const templatePolicy = new TemplatePolicy();

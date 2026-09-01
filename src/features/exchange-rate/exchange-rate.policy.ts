import ExchangeRateEntity from '@/features/exchange-rate/exchange-rate.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class ExchangeRatePolicy extends PolicyAbstract {
	constructor() {
		const entity = ExchangeRateEntity.NAME;

		super(entity);
	}
}

export const exchangeRatePolicy = new ExchangeRatePolicy();

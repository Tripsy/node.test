import { createPastDate } from '../helpers/date.helper';
import AccountTokenRepository from '../repositories/account-token.repository';

// Remove expired account tokens
export const cleanAccountToken = async () => {
	const countRemoved = await AccountTokenRepository.createQuery()
		.filterByRange('expire_at', undefined, createPastDate(86400))
		.delete(false, true, true);

	return {
		removed: countRemoved,
	};
};

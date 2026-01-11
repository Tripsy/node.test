import { getAccountTokenRepository } from '@/features/account/account-token.repository';
import { createPastDate } from '@/helpers';

// Remove expired account tokens
export const cleanAccountToken = async () => {
	const countRemoved = await getAccountTokenRepository()
		.createQuery()
		.filterByRange('expire_at', undefined, createPastDate(86400))
		.delete(false, true, true);

	return {
		removed: countRemoved,
	};
};

import { getAccountRecoveryRepository } from '@/features/account/account-recovery.repository';
import { createPastDate } from '@/lib/helpers';

// Remove expired recovery tokens
export const cleanAccountRecovery = async () => {
	const countRemoved = await getAccountRecoveryRepository()
		.createQuery()
		.filterByRange('expire_at', undefined, createPastDate(86400 * 30)) // older than 30 days
		.delete(false, true, true);

	return {
		removed: countRemoved,
	};
};

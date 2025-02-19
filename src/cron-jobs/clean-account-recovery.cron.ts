import {createPastDate} from '../helpers/utils';
import AccountRecoveryRepository from '../repositories/account-recovery.repository';

// Remove expired recovery tokens
export const cleanAccountRecoveryCron = async (): Promise<{}> => {
    const countRemoved = await AccountRecoveryRepository.createQuery()
        .filterByRange('expire_at', undefined, createPastDate(86400 * 30)) // older than 30 days
        .delete(false, true, true);

    return {
        removed: countRemoved
    };
};
import AccountRecoveryRepository from '../repositories/account-recovery.repository';
import {createPastDate} from '../helpers/date.helper';

// Remove expired recovery tokens
export const cleanAccountRecovery = async (): Promise<{}> => {
    const countRemoved = await AccountRecoveryRepository.createQuery()
        .filterByRange('expire_at', undefined, createPastDate(86400 * 30)) // older than 30 days
        .delete(false, true, true);

    return {
        removed: countRemoved
    };
};
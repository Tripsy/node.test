import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';

const UserPermissionCreateValidator = z
    .object({
        permission_ids: z
            .array(z.number(), {
                message: lang('permission.validation.permission_ids_invalid'),
            })
    });

export default UserPermissionCreateValidator;

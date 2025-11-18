import { z } from 'zod';
import { lang } from '../../config/i18n-setup.config';

const PermissionCreateValidator = z.object({
	entity: z.string({ message: lang('permission.validation.entity_invalid') }),
	operation: z.string({ message: lang('user.validation.operation_invalid') }),
});

export default PermissionCreateValidator;

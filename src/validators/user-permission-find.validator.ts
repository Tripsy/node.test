import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {cfg} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';

enum UserPermissionOrderByEnum {
    ID = 'id',
    ENTITY = 'permission.entity',
    OPERATION = 'permission.operation',
}

const UserPermissionFindValidator = z
    .object({
        order_by: z
            .nativeEnum(UserPermissionOrderByEnum)
            .optional()
            .default(UserPermissionOrderByEnum.ID),
        direction: z
            .nativeEnum(OrderDirectionEnum)
            .optional()
            .default(OrderDirectionEnum.ASC),
        limit: z
            .number({message: lang('error.invalid_number')})
            .min(1)
            .optional()
            .default(cfg('filter.limit')),
        page: z
            .number({message: lang('error.invalid_number')})
            .min(1)
            .optional()
            .default(1),
        filter: z.object({
            entity: z
                .string({message: lang('error.invalid_string')})
                .min(cfg('filter.termMinLength'), {
                    message: lang('error.string_min', {
                        min: cfg('filter.termMinLength').toString(),
                        term: 'entity',
                    }),
                })
                .optional(),
            operation: z
                .string({message: lang('error.invalid_string')})
                .min(cfg('filter.termMinLength'), {
                    message: lang('error.string_min', {
                        min: cfg('filter.termMinLength').toString(),
                        term: 'operation',
                    }),
                })
                .optional(),
            is_deleted: z
                .boolean({message: lang('error.invalid_boolean')})
                .default(false),
        })
    });

export default UserPermissionFindValidator;

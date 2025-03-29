import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {UserStatusEnum} from '../enums/user-status.enum';
import {settings} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';

enum UserOrderByEnum {
    ID = 'id',
    NAME = 'name',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

const UserFindValidator = z
    .object({
        order_by: z
            .nativeEnum(UserOrderByEnum)
            .optional()
            .default(UserOrderByEnum.ID),
        direction: z
            .nativeEnum(OrderDirectionEnum)
            .optional()
            .default(OrderDirectionEnum.ASC),
        limit: z
            .number({message: lang('error.filter_number')})
            .min(1)
            .optional()
            .default(settings.filter.defaultLimit),
        page: z
            .number({message: lang('error.filter_number')})
            .min(1)
            .optional()
            .default(1),
        filter: z.object({
            id: z
                .number({message: lang('error.filter_number')})
                .optional(),
            name: z
                .string({message: lang('error.filter_string')})
                .min(settings.filter.termMinLength, {
                    message: lang('error.filter_min', {
                        min: settings.filter.termMinLength.toString(),
                        term: 'name',
                    }),
                })
                .optional(),
            email: z
                .string({message: lang('error.filter_string')})
                .min(settings.filter.termMinLength, {
                    message: lang('error.filter_min', {
                        min: settings.filter.termMinLength.toString(),
                        term: 'email',
                    }),
                })
                .optional(),
            status: z
                .nativeEnum(UserStatusEnum)
                .optional(),
            create_date_start: z
                .string({message: lang('error.filter_string')})
                .regex(settings.filter.dateFormatRegex, {
                    message: lang('error.filter_date_format', {format: settings.filter.dateFormatLiteral}),
                })
                .optional(),
            create_date_end: z
                .string({message: lang('error.filter_string')})
                .regex(settings.filter.dateFormatRegex, {
                    message: lang('error.filter_date_format', {format: settings.filter.dateFormatLiteral}),
                })
                .optional(),
            is_deleted: z
                .boolean({message: lang('error.filter_boolean')})
                .default(false),
        })
    });

export default UserFindValidator;

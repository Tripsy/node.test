import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {cfg} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';
import {LogCategoryEnum} from '../enums/log-category.enum';
import {LogLevelEnum} from '../enums/log-level.enum';

enum UserOrderByEnum {
    ID = 'id',
    PID = 'pid',
    CATEGORY = 'category',
    LEVEL = 'level',
    CREATED_AT = 'created_at',
}

const LogDataFindValidator = z
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
            id: z
                .number({message: lang('error.invalid_number')})
                .optional(),
            pid: z
                .string({message: lang('error.invalid_string')})
                .min(cfg('filter.termMinLength'), {
                    message: lang('error.string_min', {
                        min: cfg('filter.termMinLength').toString(),
                        term: 'pid',
                    }),
                })
                .optional(),
            category: z
                .nativeEnum(LogCategoryEnum)
                .optional(),
            level: z
                .nativeEnum(LogLevelEnum)
                .optional(),
            message: z
                .string({message: lang('error.invalid_string')})
                .min(cfg('filter.termMinLength'), {
                    message: lang('error.string_min', {
                        min: cfg('filter.termMinLength').toString(),
                        term: 'message',
                    }),
                })
                .optional(),
            context: z
                .string({message: lang('error.invalid_string')})
                .min(cfg('filter.termMinLength'), {
                    message: lang('error.string_min', {
                        min: cfg('filter.termMinLength').toString(),
                        term: 'context',
                    }),
                })
                .optional(),
            create_date_start: z
                .string({message: lang('error.invalid_string')})
                .regex(cfg('filter.dateFormatRegex'), {
                    message: lang('error.invalid_date_format', {format: cfg('filter.dateFormatLiteral')}),
                })
                .optional(),
            create_date_end: z
                .string({message: lang('error.invalid_string')})
                .regex(cfg('filter.dateFormatRegex'), {
                    message: lang('error.invalid_date_format', {format: cfg('filter.dateFormatLiteral')}),
                })
                .optional(),
        })
    });

export default LogDataFindValidator;

import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {cfg} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';
import {CronHistoryStatusEnum} from '../enums/cron-history-status.enum';

enum UserOrderByEnum {
    ID = 'id',
    LABEL = 'label',
    STATUS = 'status',
    START_AT = 'start_at',
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
            status: z
                .nativeEnum(CronHistoryStatusEnum)
                .optional(),
            label: z
                .string({message: lang('error.invalid_string')})
                .min(cfg('filter.termMinLength'), {
                    message: lang('error.string_min', {
                        min: cfg('filter.termMinLength').toString(),
                        term: 'label',
                    }),
                })
                .optional(),
            content: z
                .string({message: lang('error.invalid_string')})
                .min(cfg('filter.termMinLength'), {
                    message: lang('error.string_min', {
                        min: cfg('filter.termMinLength').toString(),
                        term: 'message',
                    }),
                })
                .optional(),
            start_at_start: z
                .string({message: lang('error.invalid_string')})
                .regex(cfg('filter.dateFormatRegex'), {
                    message: lang('error.invalid_date_format', {format: cfg('filter.dateFormatLiteral')}),
                })
                .optional(),
            start_at_end: z
                .string({message: lang('error.invalid_string')})
                .regex(cfg('filter.dateFormatRegex'), {
                    message: lang('error.invalid_date_format', {format: cfg('filter.dateFormatLiteral')}),
                })
                .optional(),
        })
    });

export default LogDataFindValidator;

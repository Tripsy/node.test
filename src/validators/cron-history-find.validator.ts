import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {settings} from '../config/settings.config';
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
            status: z
                .nativeEnum(CronHistoryStatusEnum)
                .optional(),
            label: z
                .string({message: lang('error.filter_string')})
                .min(settings.filter.termMinLength, {
                    message: lang('error.filter_min', {
                        min: settings.filter.termMinLength.toString(),
                        term: 'label',
                    }),
                })
                .optional(),
            content: z
                .string({message: lang('error.filter_string')})
                .min(settings.filter.termMinLength, {
                    message: lang('error.filter_min', {
                        min: settings.filter.termMinLength.toString(),
                        term: 'message',
                    }),
                })
                .optional(),
            start_at_start: z
                .string({message: lang('error.filter_string')})
                .regex(settings.filter.dateFormatRegex, {
                    message: lang('error.filter_date_format', {format: settings.filter.dateFormatLiteral}),
                })
                .optional(),
            start_at_end: z
                .string({message: lang('error.filter_string')})
                .regex(settings.filter.dateFormatRegex, {
                    message: lang('error.filter_date_format', {format: settings.filter.dateFormatLiteral}),
                })
                .optional(),
        })
    });

export default LogDataFindValidator;

import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {cfg} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';
import {CronHistoryStatusEnum} from '../enums/cron-history-status.enum';
import BadRequestError from '../exceptions/bad-request.error';
import {parseJsonFilter} from "../helpers/utils.helper";

enum OrderByEnum {
    ID = 'id',
    LABEL = 'label',
    STATUS = 'status',
    START_AT = 'start_at',
}

const LogDataFindValidator = z
    .object({
        order_by: z
            .nativeEnum(OrderByEnum)
            .optional()
            .default(OrderByEnum.ID),
        direction: z
            .nativeEnum(OrderDirectionEnum)
            .optional()
            .default(OrderDirectionEnum.ASC),
        limit: z.coerce
            .number({message: lang('error.invalid_number')})
            .min(1)
            .optional()
            .default(cfg('filter.limit')),
        page: z.coerce
            .number({message: lang('error.invalid_number')})
            .min(1)
            .optional()
            .default(1),
        filter:
            z.preprocess(
                (val) => parseJsonFilter(val, () => {
                    throw new BadRequestError(lang('error.invalid_filter'))
                }),
                z.object({
                    id: z.coerce
                        .number({message: lang('error.invalid_number')})
                        .optional(),
                    term: z
                        .string({message: lang('error.invalid_string')})
                        .min(cfg('filter.termMinLength'), {
                            message: lang('error.string_min', {
                                min: cfg('filter.termMinLength').toString(),
                            }),
                        })
                        .optional(),
                    status: z
                        .nativeEnum(CronHistoryStatusEnum)
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
            )
            .optional()
            .default({
                id: undefined,
                term: undefined,
                status: undefined,
                create_date_start: undefined,
                create_date_end: undefined,
            })
    });

export default LogDataFindValidator;

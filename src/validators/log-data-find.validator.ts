import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {cfg} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';
import {LogCategoryEnum} from '../enums/log-category.enum';
import {LogLevelEnum} from '../enums/log-level.enum';
import BadRequestError from '../exceptions/bad-request.error';
import {parseJsonFilter} from '../helpers/utils.helper';
import {formatDate, isValidDate} from '../helpers/date.helper';

enum OrderByEnum {
    ID = 'id',
    PID = 'pid',
    CATEGORY = 'category',
    LEVEL = 'level',
    CREATED_AT = 'created_at',
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
                    term: z
                        .string({message: lang('error.invalid_string')})
                        .min(cfg('filter.termMinLength'), {
                            message: lang('error.string_min', {
                                min: cfg('filter.termMinLength').toString(),
                                field: 'term',
                            }),
                        })
                        .optional(),
                    create_date_start: z
                        .string({ message: lang('error.invalid_string') })
                        .optional()
                        .refine(
                            (val) => {
                                if (!val) {
                                    return true;
                                } // allow undefined or empty string
                                
                                return isValidDate(val); // `false` is string is not a valid date
                            },
                            {
                                message: lang('error.invalid_date'),
                            },
                        )
                        .transform((val) => (val ? formatDate(val) : undefined)),
                    create_date_end: z
                        .string({ message: lang('error.invalid_string') })
                        .optional()
                        .refine(
                            (val) => {
                                if (!val) {
                                    return true;
                                } // allow undefined or empty string

                                return isValidDate(val); // `false` is string is not a valid date
                            },
                            {
                                message: lang('error.invalid_date'),
                            },
                        )
                        .transform((val) => (val ? formatDate(val) : undefined)),
                })
            )
            .optional()
            .default({
                id: undefined,
                pid: undefined,
                category: undefined,
                level: undefined,
                term: undefined,
                create_date_start: undefined,
                create_date_end: undefined,
            })
    });

export default LogDataFindValidator;

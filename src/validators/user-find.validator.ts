import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {UserStatusEnum} from '../enums/user-status.enum';
import {cfg} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';
import BadRequestError from '../exceptions/bad-request.error';
import {UserRoleEnum} from '../enums/user-role.enum';
import {parseJsonFilter} from '../helpers/utils.helper';
import {formatDate, isValidDate} from '../helpers/date.helper';

enum OrderByEnum {
    ID = 'id',
    NAME = 'name',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

const UserFindValidator = z
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
                        .nativeEnum(UserStatusEnum)
                        .optional(),
                    role: z
                        .nativeEnum(UserRoleEnum)
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
                    is_deleted: z.preprocess(
                        val => val === 'true' || val === true,
                        z.boolean({message: lang('error.invalid_boolean')})
                    )
                        .default(false),
                })
            )
            .optional()
            .default({
                id: undefined,
                term: undefined,
                status: undefined,
                role: undefined,
                create_date_start: undefined,
                create_date_end: undefined,
                is_deleted: false,
            })
    });

export default UserFindValidator;

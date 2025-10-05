import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {cfg} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';
import BadRequestError from '../exceptions/bad-request.error';
import {MailQueueStatusEnum} from '../enums/mail-queue-status.enum';

enum OrderByEnum {
    ID = 'id',
    TEMPLATE_ID = 'template_id',
    SENT_AT = 'sent_at',
}

const MailQueueFindValidator = z
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
                (val) => {
                    if (typeof val === 'string') {
                        try {
                            return JSON.parse(val);
                        } catch {
                            throw new BadRequestError(lang('error.invalid_filter'));
                        }
                    }

                    return val;
                },
                z.object({
                    id: z.coerce
                        .number({message: lang('error.invalid_number')})
                        .optional(),
                    template_id: z.coerce
                        .number({message: lang('error.invalid_number')})
                        .optional(),
                    language: z
                        .string({message: lang('error.invalid_string')})
                        .length(2, {message: lang('mail_queue.validation.language_invalid')})
                        .optional(),
                    status: z
                        .nativeEnum(MailQueueStatusEnum)
                        .optional(),
                    content: z
                        .string({message: lang('error.invalid_string')})
                        .min(cfg('filter.termMinLength'), {
                            message: lang('error.string_min', {
                                min: cfg('filter.termMinLength').toString(),
                                field: 'content',
                            }),
                        })
                        .optional(),
                    to: z
                        .string({message: lang('error.invalid_string')})
                        .min(cfg('filter.termMinLength'), {
                            message: lang('error.string_min', {
                                min: cfg('filter.termMinLength').toString(),
                                field: 'to',
                            }),
                        })
                        .optional(),
                    sent_date_start: z
                        .string({message: lang('error.invalid_string')})
                        .regex(cfg('filter.dateFormatRegex'), {
                            message: lang('error.invalid_date_format', {format: cfg('filter.dateFormatLiteral')}),
                        })
                        .optional(),
                    sent_date_end: z
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
                template_id: undefined,
                status: undefined,
                content: undefined,
                to: undefined,
                sent_date_start: undefined,
                sent_date_end: undefined,
            })
    });

export default MailQueueFindValidator;

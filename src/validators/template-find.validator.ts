import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {cfg} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';
import {TemplateTypeEnum} from '../enums/template-type.enum';

enum UserOrderByEnum {
    ID = 'id',
    LABEL = 'label',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

const TemplateFindValidator = z
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
            label: z
                .string({message: lang('error.invalid_string')})
                .min(cfg('filter.termMinLength'), {
                    message: lang('error.string_min', {
                        min: cfg('filter.termMinLength').toString(),
                        term: 'label',
                    }),
                })
                .optional(),
            language: z
                .string({message: lang('error.invalid_string')})
                .length(2, {message: lang('template.validation.language_invalid')})
                .optional(),
            type: z
                .nativeEnum(TemplateTypeEnum, {message: lang('template.validation.type_invalid')})
                .optional(),
            content: z
                .string({message: lang('error.invalid_string')})
                .min(cfg('filter.termMinLength'), {
                    message: lang('error.string_min', {
                        min: cfg('filter.termMinLength').toString(),
                        term: 'content',
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
            is_deleted: z
                .boolean({message: lang('error.invalid_boolean')})
                .default(false),
        })
    });

export default TemplateFindValidator;

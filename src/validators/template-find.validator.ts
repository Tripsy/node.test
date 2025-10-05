import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {cfg} from '../config/settings.config';
import {OrderDirectionEnum} from '../enums/order-direction.enum';
import {TemplateTypeEnum} from '../enums/template-type.enum';
import BadRequestError from '../exceptions/bad-request.error';

enum OrderByEnum {
    ID = 'id',
    LABEL = 'label',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

const TemplateFindValidator = z
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
                    id: z
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
                    language: z
                        .string({message: lang('error.invalid_string')})
                        .length(2, {message: lang('template.validation.language_invalid')})
                        .optional(),
                    type: z
                        .nativeEnum(TemplateTypeEnum, {message: lang('template.validation.type_invalid')})
                        .optional(),
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
                language: undefined,
                type: undefined,
                is_deleted: false,
            })
    });

export default TemplateFindValidator;

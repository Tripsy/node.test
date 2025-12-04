import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { TemplateTypeEnum } from '@/features/template/template.entity';
import {hasAtLeastOneValue, parseJsonFilter, safeHtml} from '@/helpers/utils.helper';
import {OrderDirectionEnum} from "@/abstracts/entity.abstract";
import {cfg} from "@/config/settings.config";
import BadRequestError from "@/exceptions/bad-request.error";

export const TemplateCreateBaseValidator = z.object({
	label: z.string().nonempty({
		message: lang('template.validation.label_invalid'),
	}),
	language: z
		.string({
			message: lang('template.validation.language_invalid'),
		})
		.length(2, {
			message: lang('template.validation.language_invalid'),
		}),
	type: z.nativeEnum(TemplateTypeEnum, {
		message: lang('template.validation.type_invalid'),
	}),
});

const TemplateCreateEmailValidator = TemplateCreateBaseValidator.extend({
	type: z.literal(TemplateTypeEnum.EMAIL),
	content: z.object({
		subject: z.string().nonempty({
			message: lang('template.validation.email_subject_invalid'),
		}),
		text: z
			.string({
				message: lang('template.validation.email_text_invalid'),
			})
			.optional(),
		html: z
			.string()
			.nonempty({
				message: lang('template.validation.email_html_invalid'),
			})
			.transform((val) => safeHtml(val)),
		layout: z
			.string({
				message: lang('template.validation.email_layout_invalid'),
			})
			.optional(),
	}),
});

const TemplateCreatePageValidator = TemplateCreateBaseValidator.extend({
	type: z.literal(TemplateTypeEnum.PAGE),
	content: z.object({
		title: z.string().nonempty({
			message: lang('template.validation.page_title_invalid'),
		}),
		html: z
			.string()
			.nonempty({
				message: lang('template.validation.page_html_invalid'),
			})
			.transform((val) => safeHtml(val)),
		layout: z
			.string({
				message: lang('template.validation.page_layout_invalid'),
			})
			.optional(),
	}),
});

export const TemplateCreateValidator = z.union([
	TemplateCreateEmailValidator,
	TemplateCreatePageValidator,
]);

export const paramsUpdateList: string[] = [
    'label',
    'language',
    'type',
    'content',
];

const TemplateUpdateBaseValidator = z.object({
    label: z
        .string()
        .nonempty({
            message: lang('template.validation.label_invalid'),
        })
        .optional(),
    language: z
        .string({ message: lang('template.validation.language_invalid') })
        .length(2, {
            message: lang('template.validation.language_invalid'),
        })
        .optional(),
    type: z
        .nativeEnum(TemplateTypeEnum, {
            message: lang('template.validation.type_invalid'),
        })
        .optional(),
});

const TemplateUpdateEmailValidator = TemplateUpdateBaseValidator.extend({
    type: z.literal(TemplateTypeEnum.EMAIL),
    content: z
        .object({
            subject: z.string().nonempty({
                message: lang('template.validation.email_subject_invalid'),
            }),
            text: z
                .string({
                    message: lang('template.validation.email_text_invalid'),
                })
                .optional(),
            html: z
                .string()
                .nonempty({
                    message: lang('template.validation.email_html_invalid'),
                })
                .transform((val) => safeHtml(val)),
            layout: z
                .string({
                    message: lang('template.validation.email_layout_invalid'),
                })
                .optional(),
        })
        .optional(),
});

const TemplateUpdatePageValidator = TemplateUpdateBaseValidator.extend({
    type: z.literal(TemplateTypeEnum.PAGE),
    content: z
        .object({
            title: z.string().nonempty({
                message: lang('template.validation.page_title_invalid'),
            }),
            html: z
                .string()
                .nonempty({
                    message: lang('template.validation.page_html_invalid'),
                })
                .transform((val) => safeHtml(val)),
            layout: z
                .string({
                    message: lang('template.validation.page_layout_invalid'),
                })
                .optional(),
        })
        .optional(),
});

export const TemplateUpdateValidator = z
    .union([TemplateUpdateEmailValidator, TemplateUpdatePageValidator])
    .refine((data) => hasAtLeastOneValue(data), {
        message: lang('error.params_at_least_one', {
            params: paramsUpdateList.join(', '),
        }),
        path: ['_global'],
    });

enum OrderByEnum {
    ID = 'id',
    LABEL = 'label',
    CREATED_AT = 'created_at',
    UPDATED_AT = 'updated_at',
}

export const TemplateFindValidator = z.object({
    order_by: z.nativeEnum(OrderByEnum).optional().default(OrderByEnum.ID),
    direction: z
        .nativeEnum(OrderDirectionEnum)
        .optional()
        .default(OrderDirectionEnum.ASC),
    limit: z.coerce
        .number({ message: lang('error.invalid_number') })
        .min(1)
        .optional()
        .default(cfg('filter.limit') as number),
    page: z.coerce
        .number({ message: lang('error.invalid_number') })
        .min(1)
        .optional()
        .default(1),
    filter: z
        .preprocess(
            (val) =>
                parseJsonFilter(val, () => {
                    throw new BadRequestError(lang('error.invalid_filter'));
                }),
            z.object({
                id: z
                    .number({ message: lang('error.invalid_number') })
                    .optional(),
                term: z
                    .string({ message: lang('error.invalid_string') })
                    .optional(),
                language: z
                    .string({ message: lang('error.invalid_string') })
                    .length(2, {
                        message: lang('template.validation.language_invalid'),
                    })
                    .optional(),
                type: z
                    .nativeEnum(TemplateTypeEnum, {
                        message: lang('template.validation.type_invalid'),
                    })
                    .optional(),
                is_deleted: z
                    .preprocess(
                        (val) => val === 'true' || val === true,
                        z.boolean({ message: lang('error.invalid_boolean') }),
                    )
                    .default(false),
            }),
        )
        .optional()
        .default({
            id: undefined,
            term: undefined,
            language: undefined,
            type: undefined,
            is_deleted: false,
        }),
});
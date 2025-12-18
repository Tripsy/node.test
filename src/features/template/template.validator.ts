import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { TemplateTypeEnum } from '@/features/template/template.entity';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	safeHtml,
	validateBoolean,
	validateEnum,
} from '@/helpers';

export const paramsUpdateList: string[] = [
	'label',
	'language',
	'type',
	'content',
];

export function TemplateCreateValidator() {
	const TemplateCreateBaseValidator = z.object({
		label: z.string().nonempty({
			message: lang('template.validation.label_invalid'),
		}),
		language: z.string().length(2, {
			message: lang('template.validation.language_invalid'),
		}),
		type: validateEnum(
			TemplateTypeEnum,
			lang('template.validation.type_invalid'),
		),
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

	return z.union([TemplateCreateEmailValidator, TemplateCreatePageValidator]);
}

export function TemplateUpdateValidator() {
	const TemplateUpdateBaseValidator = z.object({
		label: z
			.string()
			.nonempty({
				message: lang('template.validation.label_invalid'),
			})
			.optional(),
		language: z
			.string()
			.length(2, {
				message: lang('template.validation.language_invalid'),
			})
			.optional(),
		type: validateEnum(
			TemplateTypeEnum,
			lang('template.validation.type_invalid'),
		).optional(),
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
						message: lang(
							'template.validation.email_layout_invalid',
						),
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
						message: lang(
							'template.validation.page_layout_invalid',
						),
					})
					.optional(),
			})
			.optional(),
	});

	return z
		.union([TemplateUpdateEmailValidator, TemplateUpdatePageValidator])
		.refine((data) => hasAtLeastOneValue(data), {
			message: lang('error.params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		});
}

enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export function TemplateFindValidator() {
	return makeFindValidator({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		filterShape: {
			id: z.coerce
				.number({ message: lang('error.invalid_number') })
				.optional(),
			term: z
				.string({ message: lang('error.invalid_string') })
				.optional(),
			language: z
				.string()
				.length(2, {
					message: lang('template.validation.language_invalid'),
				})
				.optional(),
			type: z
				.enum(TemplateTypeEnum, {
					message: lang('template.validation.type_invalid'),
				})
				.optional(),
			is_deleted: validateBoolean().default(false),
		},
	});
}

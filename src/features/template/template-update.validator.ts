import { z } from 'zod';
import { lang } from '../../config/i18n-setup.config';
import { hasAtLeastOneValue, safeHtml } from '../../helpers/utils.helper';
import { TemplateTypeEnum } from './template-type.enum';

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
			body: z
				.string()
				.nonempty({
					message: lang('template.validation.page_body_invalid'),
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

export default TemplateUpdateValidator;

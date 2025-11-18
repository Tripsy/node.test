import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { TemplateTypeEnum } from '@/features/template/template-type.enum';
import { safeHtml } from '@/helpers/utils.helper';

const TemplateCreateBaseValidator = z.object({
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
	}),
});

export const TemplateCreateValidator = z.union([
	TemplateCreateEmailValidator,
	TemplateCreatePageValidator,
]);

export default TemplateCreateValidator;

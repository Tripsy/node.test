import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {TemplateTypeEnum} from '../enums/template-type.enum';

const TemplateCreateValidator = z
    .object({
        label: z
            .string({message: lang('template.validation.label_invalid')}),
        language: z
            .string({message: lang('template.validation.language_invalid')})
            .length(2, {message: lang('template.validation.language_invalid')}),
        type: z
            .nativeEnum(TemplateTypeEnum, {message: lang('template.validation.type_invalid')}),
        content: z.any(),
    })
    .superRefine((data, ctx) => {
        let contentSchema: z.ZodSchema;

        if (data.type === TemplateTypeEnum.EMAIL) {
            contentSchema = z.object({
                subject: z
                    .string({message: lang('template.validation.email_subject_invalid')}),
                text: z
                    .string({message: lang('template.validation.email_text_invalid')})
                    .optional(),
                html: z
                    .string({message: lang('template.validation.email_html_invalid')}),
                layout: z
                    .string({message: lang('template.validation.email_layout_invalid')})
                    .optional(),
            });
        } else {
            contentSchema = z.object({
                title: z
                    .string({message: lang('template.validation.page_title_invalid')}),
                body: z
                    .string({message: lang('template.validation.page_body_invalid')})
                    .optional(),
                layout: z
                    .string({message: lang('template.validation.page_layout_invalid')})
                    .optional(),
            });
        }

        const result = contentSchema.safeParse(data.content);

        if (!result.success) {
            for (const issue of result.error.issues) {
                ctx.addIssue({
                    path: ['content', ...(issue.path || [])],
                    message: issue.message,
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

export default TemplateCreateValidator;

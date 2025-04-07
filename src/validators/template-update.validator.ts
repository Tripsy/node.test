import {z} from 'zod';
import {lang} from '../config/i18n-setup.config';
import {TemplateTypeEnum} from '../enums/template-type.enum';

export const paramsUpdateList: string[] = ['label', 'language', 'type', 'content'];

const TemplateUpdateValidator = z
    .object({
        label: z
            .string({message: lang('template.validation.label_invalid')})
            .optional(),
        language: z
            .string({message: lang('template.validation.language_invalid')})
            .length(2, {message: lang('template.validation.language_invalid')})
            .optional(),
        type: z
            .nativeEnum(TemplateTypeEnum, {message: lang('template.validation.type_invalid')}),
        content: z.any()
            .optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: lang('error.params_at_least_one', {params: paramsUpdateList.join(', ')}),
        path: ['_global'], // Attach error at the root level
    })    
    .superRefine((data, ctx) => {
        if (data.content) {
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
        }
    });

export default TemplateUpdateValidator;

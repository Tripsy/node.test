import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { TemplateTypeEnum } from '@/features/template/template.entity';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	safeHtml,
	validateBoolean,
	validateEnum,
	validateLanguage,
	validateString,
} from '@/lib/helpers';

export const paramsUpdateList: string[] = [
	'label',
	'language',
	'type',
	'content',
];

enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export class TemplateValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	public create() {
		const TemplateCreateBaseValidator = z.object({
			label: validateString(lang('template.validation.label_invalid')),
			language: validateLanguage(),
			type: validateEnum(
				TemplateTypeEnum,
				lang('template.validation.type_invalid'),
			),
		});

		const TemplateCreateEmailValidator = TemplateCreateBaseValidator.extend(
			{
				type: z.literal(TemplateTypeEnum.EMAIL),
				content: z.object({
					subject: validateString(
						lang('template.validation.email_subject_invalid'),
					),
					text: z
						.string({
							message: lang(
								'template.validation.email_text_invalid',
							),
						})
						.optional(),
					html: validateString(
						lang('template.validation.email_html_invalid'),
					).transform((val) => safeHtml(val)),
					layout: z
						.string({
							message: lang(
								'template.validation.email_layout_invalid',
							),
						})
						.optional(),
				}),
			},
		);

		const TemplateCreatePageValidator = TemplateCreateBaseValidator.extend({
			type: z.literal(TemplateTypeEnum.PAGE),
			content: z.object({
				title: validateString(
					lang('template.validation.page_title_invalid'),
				),
				html: validateString(
					lang('template.validation.page_html_invalid'),
				).transform((val) => safeHtml(val)),
				layout: z
					.string({
						message: lang(
							'template.validation.page_layout_invalid',
						),
					})
					.optional(),
			}),
		});

		return z.union([
			TemplateCreateEmailValidator,
			TemplateCreatePageValidator,
		]);
	}

	update() {
		const TemplateUpdateBaseValidator = z.object({
			label: validateString(
				lang('template.validation.label_invalid'),
			).optional(),
			language: validateLanguage().optional(),
			type: validateEnum(
				TemplateTypeEnum,
				lang('template.validation.type_invalid'),
			).optional(),
		});

		const TemplateUpdateEmailValidator = TemplateUpdateBaseValidator.extend(
			{
				type: z.literal(TemplateTypeEnum.EMAIL),
				content: z
					.object({
						subject: validateString(
							lang('template.validation.email_subject_invalid'),
						),
						text: z
							.string({
								message: lang(
									'template.validation.email_text_invalid',
								),
							})
							.optional(),
						html: validateString(
							lang('template.validation.page_html_invalid'),
						).transform((val) => safeHtml(val)),
						layout: z
							.string({
								message: lang(
									'template.validation.email_layout_invalid',
								),
							})
							.optional(),
					})
					.optional(),
			},
		);

		const TemplateUpdatePageValidator = TemplateUpdateBaseValidator.extend({
			type: z.literal(TemplateTypeEnum.PAGE),
			content: z
				.object({
					title: validateString(
						lang('template.validation.page_title_invalid'),
					),
					html: validateString(
						lang('template.validation.page_html_invalid'),
					).transform((val) => safeHtml(val)),
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
				message: lang('shared.validation.params_at_least_one', {
					params: paramsUpdateList.join(', '),
				}),
				path: ['_global'],
			});
	}

	find() {
		return makeFindValidator({
			orderByEnum: OrderByEnum,
			defaultOrderBy: OrderByEnum.ID,

			directionEnum: OrderDirectionEnum,
			defaultDirection: OrderDirectionEnum.ASC,

			defaultLimit: this.defaultFilterLimit,
			defaultPage: 1,

			filterShape: {
				id: z.coerce
					.number({
						message: lang('shared.validation.invalid_number'),
					})
					.optional(),
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.optional(),
				language: validateLanguage().optional(),
				type: z
					.enum(TemplateTypeEnum, {
						message: lang('template.validation.type_invalid'),
					})
					.optional(),
				is_deleted: validateBoolean().default(false),
			},
		});
	}
}

export const templateValidator = new TemplateValidator();

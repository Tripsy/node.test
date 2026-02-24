import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { TemplateTypeEnum } from '@/features/template/template.entity';
import { hasAtLeastOneValue, safeHtml } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = [
	'label',
	'language',
	'type',
	'content',
];

export enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export class TemplateValidator extends BaseValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	public create() {
		const TemplateCreateBaseValidator = z.object({
			label: this.validateString(
				lang('template.validation.label_invalid'),
			),
			language: this.validateLanguage(),
			type: this.validateEnum(
				TemplateTypeEnum,
				lang('template.validation.type_invalid'),
			),
		});

		const TemplateCreateEmailValidator = TemplateCreateBaseValidator.extend(
			{
				type: z.literal(TemplateTypeEnum.EMAIL),
				content: z.object({
					subject: this.validateString(
						lang('template.validation.email_subject_invalid'),
					),
					text: z
						.string({
							message: lang(
								'template.validation.email_text_invalid',
							),
						})
						.optional(),
					html: this.validateString(
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
				title: this.validateString(
					lang('template.validation.page_title_invalid'),
				),
				html: this.validateString(
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
			label: this.validateString(
				lang('template.validation.label_invalid'),
			).optional(),
			language: this.validateLanguage().optional(),
			type: this.validateEnum(
				TemplateTypeEnum,
				lang('template.validation.type_invalid'),
			).optional(),
		});

		const TemplateUpdateEmailValidator = TemplateUpdateBaseValidator.extend(
			{
				type: z.literal(TemplateTypeEnum.EMAIL),
				content: z
					.object({
						subject: this.validateString(
							lang('template.validation.email_subject_invalid'),
						),
						text: z
							.string({
								message: lang(
									'template.validation.email_text_invalid',
								),
							})
							.optional(),
						html: this.validateString(
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
					title: this.validateString(
						lang('template.validation.page_title_invalid'),
					),
					html: this.validateString(
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
		return this.makeFindValidator({
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
				language: this.validateLanguage().optional(),
				type: z
					.enum(TemplateTypeEnum, {
						message: lang('template.validation.type_invalid'),
					})
					.optional(),
				is_deleted: this.validateBoolean().default(false),
			},
		});
	}
}

export const templateValidator = new TemplateValidator();

import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { BrandStatusEnum, BrandTypeEnum } from '@/features/brand/brand.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = ['name', 'slug', 'type'];

export enum OrderByEnum {
	ID = 'id',
}

export class BrandValidator extends BaseValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	brandContentSchema() {
		return z.object({
			language: this.validateLanguage(),
			description: this.validateString(
				lang('brand.validation.description_invalid'),
			).optional(),
			meta: this.validateMeta(),
		});
	}

	create() {
		return z.object({
			name: this.validateString(lang('brand.validation.name_invalid')),
			slug: this.validateString(
				lang('brand.validation.slug_invalid'),
			).transform((val) => val.trim().toLowerCase()),
			type: this.validateEnum(
				BrandTypeEnum,
				lang('brand.validation.type_invalid'),
			),
			content: this.brandContentSchema().array(),
		});
	}

	update() {
		return z
			.object({
				name: this.validateString(
					lang('brand.validation.name_invalid'),
				).optional(),
				slug: this.validateString(lang('brand.validation.slug_invalid'))
					.transform((val) => val.trim().toLowerCase())
					.optional(),
				type: this.validateEnum(
					BrandTypeEnum,
					lang('brand.validation.type_invalid'),
				).optional(),
				content: this.brandContentSchema().array().optional(),
			})
			.refine((data) => hasAtLeastOneValue(data), {
				message: lang('shared.validation.params_at_least_one', {
					params: [...paramsUpdateList, 'content'].join(', '),
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
				type: z.enum(BrandTypeEnum).optional(),
				status: z.enum(BrandStatusEnum).optional(),
				language: this.validateLanguage().optional(),
				is_deleted: this.validateBoolean().default(false),
			},
		});
	}

	orderUpdate() {
		return z.object({
			positions: z
				.array(
					z.number({
						message: lang('shared.validation.invalid_number'),
					}),
				)
				.min(2, {
					message: lang('shared.validation.array_min', {
						length: '2',
					}),
				}),
		});
	}
}

export const brandValidator = new BrandValidator();

import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { PlaceTypeEnum } from '@/features/place/place.entity';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	nullableString,
	validateBoolean,
	validateEnum,
	validateLanguage,
	validateString,
} from '@/lib/helpers';

export const paramsUpdateList: string[] = ['type', 'code', 'parent_id'];

enum OrderByEnum {
	ID = 'id',
}

export class PlaceValidator {
	private readonly defaultFilterLimit = cfg('filter.limit') as number;

	placeContentSchema() {
		return z.object({
			language: validateLanguage(),
			name: validateString(lang('place.validation.name_invalid')),
			type_label: validateString(
				lang('place.validation.type_label_invalid'),
			),
		});
	}

	create() {
		return z
			.object({
				type: validateEnum(
					PlaceTypeEnum,
					lang('place.validation.type_invalid'),
				),
				code: validateString(
					lang('place.validation.code_invalid'),
				).optional(),
				parent_id: z.coerce
					.number({
						message: lang('place.validation.invalid_parent_id'),
					})
					.optional(),
				content: this.placeContentSchema().array(),
			})
			.superRefine((data, ctx) => {
				if (
					data.type &&
					[PlaceTypeEnum.REGION, PlaceTypeEnum.CITY].includes(
						data.type,
					) &&
					!data.parent_id
				) {
					ctx.addIssue({
						path: ['parent_id'],
						message: lang('place.validation.required_parent_id'),
						code: 'custom',
					});
				}
			});
	}

	update() {
		return z
			.object({
				type: validateEnum(
					PlaceTypeEnum,
					lang('place.validation.type_invalid'),
				).optional(),
				code: nullableString(lang('place.validation.code_invalid')),
				parent_id: z.coerce
					.number({ message: lang('shared.error.invalid_parent_id') })
					.optional(),
				content: this.placeContentSchema().array().optional(),
			})
			.refine((data) => hasAtLeastOneValue(data), {
				message: lang('shared.validation.params_at_least_one', {
					params: [...paramsUpdateList, 'content'].join(', '),
				}),
				path: ['_global'],
			})
			.superRefine((data, ctx) => {
				if (
					data.type &&
					[PlaceTypeEnum.REGION, PlaceTypeEnum.CITY].includes(
						data.type,
					) &&
					!data.parent_id
				) {
					ctx.addIssue({
						path: ['parent_id'],
						message: lang('place.validation.required_parent_id'),
						code: 'custom',
					});
				}
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
				type: z.enum(PlaceTypeEnum).optional(),
				language: validateLanguage().optional(),
				is_deleted: validateBoolean().default(false),
			},
		});
	}
}

export const placeValidator = new PlaceValidator();

export type PlaceValidatorCreateDto = z.infer<
	ReturnType<PlaceValidator['create']>
>;
export type PlaceValidatorUpdateDto = z.infer<
	ReturnType<PlaceValidator['update']>
>;
export type PlaceValidatorFindDto = z.infer<ReturnType<PlaceValidator['find']>>;

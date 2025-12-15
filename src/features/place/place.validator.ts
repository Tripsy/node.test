import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { PlaceTypeEnum } from '@/features/place/place.entity';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	nullableString,
	validateBoolean,
	validateEnum,
	validateString,
} from '@/helpers';

export const PlaceContentSchema = z.object({
	language: z
		.string()
		.length(2, { message: lang('place.validation.language_invalid') }),
	name: validateString(lang('place.validation.name_invalid')),
	type_label: validateString(lang('place.validation.type_label_invalid')),
});

export const PlaceCreateValidator = z
	.object({
		type: validateEnum(
			PlaceTypeEnum,
			lang('place.validation.type_invalid'),
		),
		code: validateString(lang('place.validation.code_invalid')).optional(),
		parent_id: z.coerce
			.number({ message: lang('error.invalid_parent_id') })
			.optional(),
		content: PlaceContentSchema.array(),
	})
	.superRefine((data, ctx) => {
		if (
			data.type &&
			[PlaceTypeEnum.REGION, PlaceTypeEnum.CITY].includes(data.type) &&
			!data.parent_id
		) {
			ctx.addIssue({
				path: ['parent_id'],
				message: lang('place.validation.required_parent_id'),
				code: z.ZodIssueCode.custom,
			});
		}
	});

export const paramsUpdateList: string[] = ['type', 'code', 'parent_id'];

export const PlaceUpdateValidator = z
	.object({
		type: validateEnum(
			PlaceTypeEnum,
			lang('place.validation.type_invalid'),
		).optional(),
		code: nullableString(lang('place.validation.code_invalid')),
		parent_id: z.coerce
			.number({ message: lang('error.invalid_parent_id') })
			.optional(),
		content: PlaceContentSchema.array().optional(),
	})
	.refine((data) => hasAtLeastOneValue(data), {
		message: lang('error.params_at_least_one', {
			params: ['type', 'code', 'parent_id', 'content'].join(', '),
		}),
		path: ['_global'],
	})
	.superRefine((data, ctx) => {
		if (
			data.type &&
			[PlaceTypeEnum.REGION, PlaceTypeEnum.CITY].includes(data.type) &&
			!data.parent_id
		) {
			ctx.addIssue({
				path: ['parent_id'],
				message: lang('place.validation.required_parent_id'),
				code: z.ZodIssueCode.custom,
			});
		}
	});

enum OrderByEnum {
	ID = 'id',
}

export const PlaceFindValidator = makeFindValidator({
	orderByEnum: OrderByEnum,
	defaultOrderBy: OrderByEnum.ID,

	directionEnum: OrderDirectionEnum,
	defaultDirection: OrderDirectionEnum.ASC,

	filterShape: {
		term: z.string({ message: lang('error.invalid_string') }).optional(),
		type: z.nativeEnum(PlaceTypeEnum).optional(),
		language: validateString(lang('error.invalid_string')).optional(),
		is_deleted: validateBoolean().default(false),
	},
});

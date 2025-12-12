import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import {
	PlaceReasonEnum,
	type PlaceRules,
	PlaceScopeEnum,
	PlaceTypeEnum,
} from '@/features/place/place.entity';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	nullableString,
	validateBoolean,
	validateDate,
	validateEnum,
	validateString,
} from '@/helpers';

const placeRulesSchema: z.ZodType<PlaceRules> = z.record(
	z.union([z.number(), z.array(z.number()), z.array(z.string())]),
);

export const PlaceCreateValidator = z
	.object({
		label: validateString(lang('place.validation.label_invalid')),
		scope: validateEnum(
			PlaceScopeEnum,
			lang('place.validation.scope_invalid'),
		),
		reason: validateEnum(
			PlaceReasonEnum,
			lang('place.validation.reason_invalid'),
		),
		reference: nullableString(
			lang('place.validation.reference_invalid'),
		),
		type: validateEnum(
			PlaceTypeEnum,
			lang('place.validation.type_invalid'),
		),
		rules: placeRulesSchema.optional(),
		value: z.coerce
			.number({ message: lang('place.validation.value_invalid') })
			.positive({
				message: lang('place.validation.value_must_be_positive'),
			}),
		start_at: validateDate(lang('error.start_at_invalid')),
		end_at: validateDate(lang('error.end_at_invalid')),
		notes: nullableString(lang('place.validation.notes_invalid')),
	})
	.superRefine((data, ctx) => {
		if (data.end_at && data.start_at && data.end_at <= data.start_at) {
			ctx.addIssue({
				path: ['end_at'],
				message: lang(
					'place.validation.end_at_must_be_after_start_at',
				),
				code: z.ZodIssueCode.custom,
			});
		}

		// Validate that percent places are between 0 and 100
		if (
			data.type === PlaceTypeEnum.PERCENT &&
			data.value !== undefined &&
			(data.value < 0 || data.value > 100)
		) {
			ctx.addIssue({
				path: ['value'],
				message: lang(
					'place.validation.percent_must_be_between_0_and_100',
				),
				code: z.ZodIssueCode.custom,
			});
		}
	});

export const paramsUpdateList: string[] = [
	'label',
	'scope',
	'reason',
	'reference',
	'type',
	'rules',
	'value',
	'start_at',
	'end_at',
	'notes',
];

export const PlaceUpdateValidator = z
	.object({
		label: z
			.string({ message: lang('place.validation.label_invalid') })
			.nonempty({
				message: lang('place.validation.label_invalid'),
			})
			.optional(),
		scope: validateEnum(
			PlaceScopeEnum,
			lang('place.validation.scope_invalid'),
		).optional(),
		reason: validateEnum(
			PlaceReasonEnum,
			lang('place.validation.reason_invalid'),
		).optional(),
		reference: nullableString(
			lang('place.validation.reference_invalid'),
		),
		type: validateEnum(
			PlaceTypeEnum,
			lang('place.validation.type_invalid'),
		).optional(),
		rules: placeRulesSchema.optional(),
		value: z.coerce
			.number({ message: lang('place.validation.value_invalid') })
			.positive({
				message: lang('place.validation.value_must_be_positive'),
			})
			.optional(),
		start_at: validateDate(lang('error.start_at_invalid')),
		end_at: validateDate(lang('error.end_at_invalid')),
		notes: nullableString(lang('place.validation.notes_invalid')),
	})
	.refine((data) => hasAtLeastOneValue(data), {
		message: lang('error.params_at_least_one', {
			params: paramsUpdateList.join(', '),
		}),
		path: ['_global'],
	})
	.superRefine((data, ctx) => {
		if (data.end_at && data.start_at && data.end_at <= data.start_at) {
			ctx.addIssue({
				path: ['end_at'],
				message: lang(
					'place.validation.end_at_must_be_after_start_at',
				),
				code: z.ZodIssueCode.custom,
			});
		}

		// Validate percent place if type and value are provided
		if (
			data.type === PlaceTypeEnum.PERCENT &&
			data.value !== undefined &&
			(data.value < 0 || data.value > 100)
		) {
			ctx.addIssue({
				path: ['value'],
				message: lang(
					'place.validation.percent_must_be_between_0_and_100',
				),
				code: z.ZodIssueCode.custom,
			});
		}
	});

enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	START_AT = 'start_at',
	END_AT = 'end_at',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export const PlaceFindValidator = makeFindValidator({
	orderByEnum: OrderByEnum,
	defaultOrderBy: OrderByEnum.ID,

	directionEnum: OrderDirectionEnum,
	defaultDirection: OrderDirectionEnum.ASC,

	filterShape: {
		id: z.coerce
			.number({ message: lang('error.invalid_number') })
			.optional(),
		term: z.string({ message: lang('error.invalid_string') }).optional(),
		scope: z.nativeEnum(PlaceScopeEnum).optional(),
		reason: z.nativeEnum(PlaceReasonEnum).optional(),
		type: z.nativeEnum(PlaceTypeEnum).optional(),
		reference: z.string().optional(),
		start_at_start: validateDate(),
		start_at_end: validateDate(),
		is_deleted: validateBoolean().default(false),
	},
}).superRefine((data, ctx) => {
	if (
		data.filter.start_at_start &&
		data.filter.start_at_end &&
		data.filter.start_at_start > data.filter.start_at_end
	) {
		ctx.addIssue({
			path: ['filter', 'start_at_start'],
			message: lang('error.invalid_date_range'),
			code: z.ZodIssueCode.custom,
		});
	}
});

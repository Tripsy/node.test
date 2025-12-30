import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	DiscountReasonEnum,
	type DiscountRules,
	DiscountScopeEnum,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	nullableString,
	validateBoolean,
	validateDate,
	validateEnum,
	validateString,
} from '@/lib/helpers';

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

const discountRulesSchema: z.ZodType<DiscountRules> = z.record(
	z.string(), // Keys are strings
	z.union([
		z.number(), // Single number
		z.array(z.number()), // Array of number
		z.array(z.string()), // Array of string
	]),
);

export function DiscountCreateValidator() {
	return z
		.object({
			label: validateString(lang('discount.validation.label_invalid')),
			scope: validateEnum(
				DiscountScopeEnum,
				lang('discount.validation.scope_invalid'),
			),
			reason: validateEnum(
				DiscountReasonEnum,
				lang('discount.validation.reason_invalid'),
			),
			reference: nullableString(
				lang('discount.validation.reference_invalid'),
			),
			type: validateEnum(
				DiscountTypeEnum,
				lang('discount.validation.type_invalid'),
			),
			rules: discountRulesSchema.optional(),
			value: z.coerce
				.number({ message: lang('discount.validation.value_invalid') })
				.positive({
					message: lang('discount.validation.value_must_be_positive'),
				}),
			start_at: validateDate(lang('shared.error.start_at_invalid')),
			end_at: validateDate(lang('shared.error.end_at_invalid')),
			notes: nullableString(lang('discount.validation.notes_invalid')),
		})
		.superRefine((data, ctx) => {
			if (data.end_at && data.start_at && data.end_at <= data.start_at) {
				ctx.addIssue({
					path: ['end_at'],
					message: lang(
						'discount.validation.end_at_must_be_after_start_at',
					),
					code: 'custom',
				});
			}

			// Validate that percent discounts are between 0 and 100
			if (
				data.type === DiscountTypeEnum.PERCENT &&
				data.value !== undefined &&
				(data.value < 0 || data.value > 100)
			) {
				ctx.addIssue({
					path: ['value'],
					message: lang(
						'discount.validation.percent_must_be_between_0_and_100',
					),
					code: 'custom',
				});
			}
		});
}

export function DiscountUpdateValidator() {
	return z
		.object({
			label: validateString(
				lang('discount.validation.label_invalid'),
			).optional(),
			scope: validateEnum(
				DiscountScopeEnum,
				lang('discount.validation.scope_invalid'),
			).optional(),
			reason: validateEnum(
				DiscountReasonEnum,
				lang('discount.validation.reason_invalid'),
			).optional(),
			reference: nullableString(
				lang('discount.validation.reference_invalid'),
			),
			type: validateEnum(
				DiscountTypeEnum,
				lang('discount.validation.type_invalid'),
			).optional(),
			rules: discountRulesSchema.optional(),
			value: z.coerce
				.number({ message: lang('discount.validation.value_invalid') })
				.positive({
					message: lang('discount.validation.value_must_be_positive'),
				})
				.optional(),
			start_at: validateDate(lang('shared.error.start_at_invalid')),
			end_at: validateDate(lang('shared.error.end_at_invalid')),
			notes: nullableString(lang('discount.validation.notes_invalid')),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: lang('shared.validation.params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		})
		.superRefine((data, ctx) => {
			if (data.end_at && data.start_at && data.end_at <= data.start_at) {
				ctx.addIssue({
					path: ['end_at'],
					message: lang(
						'discount.validation.end_at_must_be_after_start_at',
					),
					code: 'custom',
				});
			}

			// Validate percent discount if type and value are provided
			if (
				data.type === DiscountTypeEnum.PERCENT &&
				data.value !== undefined &&
				(data.value < 0 || data.value > 100)
			) {
				ctx.addIssue({
					path: ['value'],
					message: lang(
						'discount.validation.percent_must_be_between_0_and_100',
					),
					code: 'custom',
				});
			}
		});
}
enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	START_AT = 'start_at',
	END_AT = 'end_at',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export function DiscountFindValidator() {
	return makeFindValidator({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: cfg('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
			id: z.coerce
				.number({ message: lang('shared.validation.invalid_number') })
				.optional(),
			term: z
				.string({ message: lang('shared.validation.invalid_string') })
				.optional(),
			scope: z.enum(DiscountScopeEnum).optional(),
			reason: z.enum(DiscountReasonEnum).optional(),
			type: z.enum(DiscountTypeEnum).optional(),
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
				message: lang('shared.validation.invalid_date_range'),
				code: 'custom',
			});
		}
	});
}

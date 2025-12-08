import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	hasAtLeastOneValue,
	makeJsonFilterSchema,
	nullableString,
	validateBoolean,
} from '@/helpers';

export const CarrierCreateValidator = z.object({
	name: z
		.string({ message: lang('carrier.validation.name_invalid') })
		.nonempty({
			message: lang('carrier.validation.name_invalid'),
		}),
	website: z.preprocess(
		(val) => (val === '' ? null : val),
		z
			.string({ message: lang('carrier.validation.website_invalid') })
			.url({ message: lang('carrier.validation.website_invalid') })
			.nullable()
			.optional(),
	),
	phone: nullableString(lang('carrier.validation.phone_invalid')),
	email: z.preprocess(
		(val) => (val === '' ? null : val),
		z
			.string({ message: lang('carrier.validation.email_invalid') })
			.email({ message: lang('carrier.validation.email_invalid') })
			.nullable()
			.optional(),
	),
	notes: z
		.string({ message: lang('carrier.validation.notes_invalid') })
		.optional()
		.nullable(),
});

export const paramsUpdateList: string[] = [
	'name',
	'website',
	'phone',
	'email',
	'notes',
];

export const CarrierUpdateValidator = z
	.object({
		name: z
			.string({ message: lang('carrier.validation.name_invalid') })
			.nonempty({
				message: lang('carrier.validation.name_invalid'),
			})
			.optional(),
		website: z.preprocess(
			(val) => (val === '' ? null : val),
			z
				.string({ message: lang('carrier.validation.website_invalid') })
				.url({ message: lang('carrier.validation.website_invalid') })
				.nullable()
				.optional(),
		),
		phone: nullableString(lang('carrier.validation.phone_invalid')),
		email: z.preprocess(
			(val) => (val === '' ? null : val),
			z
				.string({ message: lang('carrier.validation.email_invalid') })
				.email({ message: lang('carrier.validation.email_invalid') })
				.nullable()
				.optional(),
		),
		notes: z
			.string({ message: lang('carrier.validation.notes_invalid') })
			.optional()
			.nullable(),
	})
	.refine((data) => hasAtLeastOneValue(data), {
		message: lang('error.params_at_least_one', {
			params: paramsUpdateList.join(', '),
		}),
		path: ['_global'],
	});

enum OrderByEnum {
	ID = 'id',
	NAME = 'name',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export const CarrierFindValidator = z.object({
	order_by: z.nativeEnum(OrderByEnum).optional().default(OrderByEnum.ID),
	direction: z
		.nativeEnum(OrderDirectionEnum)
		.optional()
		.default(OrderDirectionEnum.ASC),
	limit: z.coerce
		.number({ message: lang('error.invalid_number') })
		.min(1)
		.optional()
		.default(cfg('filter.limit') as number),
	page: z.coerce
		.number({ message: lang('error.invalid_number') })
		.min(1)
		.optional()
		.default(1),
	filter: makeJsonFilterSchema({
		id: z.coerce
			.number({ message: lang('error.invalid_number') })
			.optional(),
		term: z.string({ message: lang('error.invalid_string') }).optional(),
		is_deleted: validateBoolean().default(false),
	})
		.optional()
		.default({
			id: undefined,
			term: undefined,
			is_deleted: false,
		}),
});

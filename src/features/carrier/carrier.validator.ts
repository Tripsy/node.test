import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	nullableString,
	validateBoolean,
	validateString,
} from '@/lib/helpers';

export const paramsUpdateList: string[] = [
	'name',
	'website',
	'phone',
	'email',
	'notes',
];

export function CarrierCreateValidator() {
	return z.object({
		name: validateString(lang('carrier.validation.name_invalid')),
		website: z.preprocess(
			(val) => (val === '' ? null : val),
			z
				.url({ message: lang('carrier.validation.website_invalid') })
				.nullable()
				.optional(),
		),
		phone: nullableString(lang('carrier.validation.phone_invalid')),
		email: z.preprocess(
			(val) => (val === '' ? null : val),
			z
				.email({ message: lang('carrier.validation.email_invalid') })
				.nullable()
				.optional(),
		),
		notes: nullableString(lang('carrier.validation.notes_invalid')),
	});
}

export function CarrierUpdateValidator() {
	return z
		.object({
			name: validateString(
				lang('carrier.validation.name_invalid'),
			).optional(),
			website: z.preprocess(
				(val) => (val === '' ? null : val),
				z
					.url({
						message: lang('carrier.validation.website_invalid'),
					})
					.nullable()
					.optional(),
			),
			phone: nullableString(lang('carrier.validation.phone_invalid')),
			email: z.preprocess(
				(val) => (val === '' ? null : val),
				z
					.email({
						message: lang('carrier.validation.email_invalid'),
					})
					.nullable()
					.optional(),
			),
			notes: nullableString(lang('carrier.validation.notes_invalid')),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: lang('shared.validation.params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		});
}

enum OrderByEnum {
	ID = 'id',
	NAME = 'name',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export function CarrierFindValidator() {
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
			is_deleted: validateBoolean().default(false),
		},
	});
}

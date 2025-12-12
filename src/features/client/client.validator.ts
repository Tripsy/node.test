import { z } from 'zod';
import { OrderDirectionEnum } from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import {
	ClientStatusEnum,
	ClientTypeEnum,
} from '@/features/client/client.entity';
import {
	makeFindValidator,
	validateBoolean,
	validateDate,
	validateEnum,
	validateNumber,
	validateString,
} from '@/helpers';

export const ClientCreateBaseValidator = z.object({
	client_type: validateEnum(
		ClientTypeEnum,
		lang('client.validation.client_type_invalid'),
	),
	iban: validateString(lang('client.validation.iban_invalid')).optional(),
	bank_name: validateString(
		lang('client.validation.bank_name_invalid'),
	).optional(),
	contact_name: validateString(
		lang('client.validation.contact_name_invalid'),
	).optional(),
	contact_email: z
		.string()
		.email({ message: lang('client.validation.contact_email_invalid') })
		.optional(),
	contact_phone: validateString(
		lang('client.validation.contact_phone_invalid'),
	).optional(),
	address_country: validateNumber(
		lang('client.validation.address_country_invalid'),
	).optional(),
	address_county: validateNumber(
		lang('client.validation.address_county_invalid'),
	).optional(),
	address_city: validateNumber(
		lang('client.validation.address_city_invalid'),
	).optional(),
	address_info: validateString(
		lang('client.validation.address_info_invalid'),
	).optional(),
	address_postal_code: validateNumber(
		lang('client.validation.address_postal_code_invalid'),
	).optional(),
});

export const ClientCreateCompanyValidator = ClientCreateBaseValidator.extend({
	client_type: z.literal(ClientTypeEnum.COMPANY),
	company_name: validateString(
		lang('client.validation.company_name_invalid'),
	),
	company_cui: validateString(lang('client.validation.company_cui_invalid')),
	company_reg_com: validateString(
		lang('client.validation.company_reg_com_invalid'),
	),
});

export const ClientCreatePersonValidator = ClientCreateBaseValidator.extend({
	client_type: z.literal(ClientTypeEnum.PERSON),
	person_name: validateString(lang('client.validation.person_name_invalid')),
	person_cnp: validateString(
		lang('client.validation.person_cnp_invalid'),
	).optional(),
	person_phone: validateString(
		lang('client.validation.person_phone_invalid'),
	),
});

export const ClientCreateValidator = z.union([
	ClientCreateCompanyValidator,
	ClientCreatePersonValidator,
]);

export const paramsUpdateList = [
	'client_type',
	'status',
	'company_name',
	'company_cui',
	'company_reg_com',
	'person_name',
	'person_cnp',
	'iban',
	'bank_name',
	'contact_name',
	'contact_email',
	'contact_phone',
	'address_country',
	'address_county',
	'address_city',
	'address_street',
	'address_postal_code',
	'notes',
];

export const ClientUpdateBaseValidator = z.object({
	client_type: validateEnum(
		ClientTypeEnum,
		lang('client.validation.client_type_invalid'),
	).optional(),
	iban: validateString(lang('client.validation.iban_invalid')).optional(),
	bank_name: validateString(
		lang('client.validation.bank_name_invalid'),
	).optional(),
	contact_name: validateString(
		lang('client.validation.contact_name_invalid'),
	).optional(),
	contact_email: z
		.string()
		.email({ message: lang('client.validation.contact_email_invalid') })
		.optional(),
	contact_phone: validateString(
		lang('client.validation.contact_phone_invalid'),
	).optional(),
	address_country: validateNumber(
		lang('client.validation.address_country_invalid'),
	).optional(),
	address_county: validateNumber(
		lang('client.validation.address_county_invalid'),
	).optional(),
	address_city: validateNumber(
		lang('client.validation.address_city_invalid'),
	).optional(),
	address_info: validateString(
		lang('client.validation.address_info_invalid'),
	).optional(),
	address_postal_code: validateNumber(
		lang('client.validation.address_postal_code_invalid'),
	).optional(),
	notes: validateString(lang('client.validation.notes_invalid')).optional(),
});

export const ClientUpdateCompanyValidator = ClientUpdateBaseValidator.extend({
	client_type: z.literal(ClientTypeEnum.COMPANY),
	company_name: validateString(
		lang('client.validation.company_name_invalid'),
	).optional(),
	company_cui: validateString(
		lang('client.validation.company_cui_invalid'),
	).optional(),
	company_reg_com: validateString(
		lang('client.validation.company_reg_com_invalid'),
	).optional(),
});

export const ClientUpdatePersonValidator = ClientUpdateBaseValidator.extend({
	client_type: z.literal(ClientTypeEnum.PERSON),
	person_name: validateString(
		lang('client.validation.person_name_invalid'),
	).optional(),
	person_cnp: validateNumber(
		lang('client.validation.person_cnp_invalid'),
	).optional(),
	person_phone: validateString(
		lang('client.validation.person_phone_invalid'),
	).optional(),
});

export const ClientUpdateValidator = z.union([
	ClientUpdateCompanyValidator,
	ClientUpdatePersonValidator,
]);

enum OrderByEnum {
	ID = 'id',
	CREATED_AT = 'created_at',
}

export const ClientFindValidator = makeFindValidator({
	orderByEnum: OrderByEnum,
	defaultOrderBy: OrderByEnum.ID,

	directionEnum: OrderDirectionEnum,
	defaultDirection: OrderDirectionEnum.ASC,

	filterShape: {
		id: z.coerce
			.number({ message: lang('error.invalid_number') })
			.optional(),
		term: z.string({ message: lang('error.invalid_string') }).optional(),
		client_type: z.nativeEnum(ClientTypeEnum).optional(),
		status: z.nativeEnum(ClientStatusEnum).optional(),
		create_date_start: validateDate(),
		create_date_end: validateDate(),
		is_deleted: validateBoolean().default(false),
	},
}).superRefine((data, ctx) => {
	if (
		data.filter.create_date_start &&
		data.filter.create_date_end &&
		data.filter.create_date_start > data.filter.create_date_end
	) {
		ctx.addIssue({
			path: ['filter', 'create_date_start'],
			message: lang('error.invalid_date_range'),
			code: z.ZodIssueCode.custom,
		});
	}
});

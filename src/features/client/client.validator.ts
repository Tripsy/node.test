import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import {
	ClientStatusEnum,
	ClientTypeEnum,
} from '@/features/client/client.entity';
import { OrderDirectionEnum } from '@/lib/abstracts/entity.abstract';
import {
	hasAtLeastOneValue,
	makeFindValidator,
	nullableString,
	validateAddressPlaceTypes,
	validateBoolean,
	validateDate,
	validateEnum,
	validateNumber,
	validateString,
} from '@/lib/helpers';

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
	'address_region',
	'address_city',
	'address_info',
	'address_postal_code',
	'notes',
];

enum OrderByEnum {
	ID = 'id',
	CREATED_AT = 'created_at',
}

export class ClientValidator {
	private readonly defaultFilterLimit = cfg('filter.limit') as number;

	public create() {
		const ClientCreateBaseValidator = z.object({
			client_type: validateEnum(
				ClientTypeEnum,
				lang('client.validation.client_type_invalid'),
			),
			iban: validateString(
				lang('client.validation.iban_invalid'),
			).optional(),
			bank_name: validateString(
				lang('client.validation.bank_name_invalid'),
			).optional(),
			contact_name: validateString(
				lang('client.validation.contact_name_invalid'),
			).optional(),
			contact_email: z
				.email({
					message: lang('client.validation.contact_email_invalid'),
				})
				.optional(),
			contact_phone: validateString(
				lang('client.validation.contact_phone_invalid'),
			).optional(),
			address_country: validateNumber(
				lang('client.validation.address_country_invalid'),
			).optional(),
			address_region: validateNumber(
				lang('client.validation.address_region_invalid'),
			).optional(),
			address_city: validateNumber(
				lang('client.validation.address_city_invalid'),
			).optional(),
			address_info: validateString(
				lang('client.validation.address_info_invalid'),
			).optional(),
			address_postal_code: validateString(
				lang('client.validation.address_postal_code_invalid'),
			).optional(),
			notes: nullableString(lang('carrier.validation.notes_invalid')),
		});

		const ClientCreateCompanyValidator = ClientCreateBaseValidator.extend({
			client_type: z.literal(ClientTypeEnum.COMPANY),
			company_name: validateString(
				lang('client.validation.company_name_invalid'),
			),
			company_cui: validateString(
				lang('client.validation.company_cui_invalid'),
			).transform((v) => v.trim().toUpperCase()),
			company_reg_com: validateString(
				lang('client.validation.company_reg_com_invalid'),
			).transform((v) => v.trim().toUpperCase()),
		});

		const ClientCreatePersonValidator = ClientCreateBaseValidator.extend({
			client_type: z.literal(ClientTypeEnum.PERSON),
			person_name: validateString(
				lang('client.validation.person_name_invalid'),
			),
			person_cnp: validateString(
				lang('client.validation.person_cnp_invalid'),
			).optional(),
		});

		return z
			.union([ClientCreateCompanyValidator, ClientCreatePersonValidator])
			.superRefine(validateAddressPlaceTypes());
	}

	update() {
		const ClientUpdateBaseValidator = z.object({
			client_type: validateEnum(
				ClientTypeEnum,
				lang('client.validation.client_type_invalid'),
			),
			iban: validateString(
				lang('client.validation.iban_invalid'),
			).optional(),
			bank_name: validateString(
				lang('client.validation.bank_name_invalid'),
			).optional(),
			contact_name: validateString(
				lang('client.validation.contact_name_invalid'),
			).optional(),
			contact_email: z
				.email({
					message: lang('client.validation.contact_email_invalid'),
				})
				.optional(),
			contact_phone: validateString(
				lang('client.validation.contact_phone_invalid'),
			).optional(),
			address_country: validateNumber(
				lang('client.validation.address_country_invalid'),
			).optional(),
			address_region: validateNumber(
				lang('client.validation.address_region_invalid'),
			).optional(),
			address_city: validateNumber(
				lang('client.validation.address_city_invalid'),
			).optional(),
			address_info: validateString(
				lang('client.validation.address_info_invalid'),
			).optional(),
			address_postal_code: validateString(
				lang('client.validation.address_postal_code_invalid'),
			).optional(),
			notes: nullableString(lang('client.validation.notes_invalid')),
		});

		const ClientUpdateCompanyValidator = ClientUpdateBaseValidator.extend({
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

		const ClientUpdatePersonValidator = ClientUpdateBaseValidator.extend({
			client_type: z.literal(ClientTypeEnum.PERSON),
			person_name: validateString(
				lang('client.validation.person_name_invalid'),
			).optional(),
			person_cnp: validateString(
				lang('client.validation.person_cnp_invalid'),
			).optional(),
		});

		return z
			.union([ClientUpdateCompanyValidator, ClientUpdatePersonValidator])
			.refine((data) => hasAtLeastOneValue(data), {
				message: lang('shared.validation.params_at_least_one', {
					params: paramsUpdateList.join(', '),
				}),
				path: ['_global'],
			})
			.superRefine(validateAddressPlaceTypes());
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
				client_type: z.enum(ClientTypeEnum).optional(),
				status: z.enum(ClientStatusEnum).optional(),
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
					message: lang('shared.validation.invalid_date_range'),
					code: 'custom',
				});
			}
		});
	}
}

export const clientValidator = new ClientValidator();

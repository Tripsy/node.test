import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { PlaceTypeEnum } from '@/features/place/place.entity';
import { getPlaceRepository } from '@/features/place/place.repository';
import { BadRequestError } from '@/lib/exceptions';
import { isValidDate, stringToDate } from '@/lib/helpers/date.helper';

export type ValidatorDto<V, K extends keyof V> = V[K] extends (
	...args: string[]
) => z.ZodTypeAny
	? z.infer<ReturnType<V[K]>>
	: never;

/**
 * @description Utility function used to parse JSON filter string to object
 */
function parseJsonFilter(val: unknown, onError: (val: string) => unknown) {
	if (typeof val === 'string') {
		if (val.trim() === '') {
			return {};
		}

		try {
			return JSON.parse(val);
		} catch {
			return onError(val);
		}
	}

	return val;
}

/**
 * @description Used in validators to build JSON filter schema
 */
export function makeJsonFilterSchema<T extends z.ZodRawShape>(shape: T) {
	return z.preprocess(
		(val) =>
			parseJsonFilter(val, () => {
				throw new BadRequestError(
					lang('shared.validation.invalid_filter'),
				);
			}),
		z.object(shape).partial(),
	);
}

/**
 * @description Make string nullable and optional
 */
export function nullableString(msg: string) {
	return z.preprocess(
		(v) => (v === '' ? null : v),
		z.string({ message: msg }).trim().nullable().optional(),
	);
}

/**
 * @description Used in validators to make string required
 */
export function validateString(message: string) {
	return z.string().trim().nonempty({ message });
}

/**
 * @description Ensures the value is a positive number (> 0).
 * @param message Error message
 * @param onlyPositive Allow only positive numbers (default: true)
 * @param allowDecimals Allow decimal numbers (default: false)
 */
export function validateNumber(
	message: string,
	onlyPositive = true,
	allowDecimals = false,
) {
	let schema = z.number({ message });

	if (onlyPositive) {
		schema = schema.positive({ message });
	}
	if (!allowDecimals) {
		schema = schema.int({ message });
	}

	return schema;
}

/**
 * @description Convert string to boolean and validate
 */
export function validateBoolean(
	message = lang('shared.validation.invalid_boolean'),
) {
	return z.preprocess((val) => {
		if (val === 'true' || val === true) {
			return true;
		}

		if (val === 'false' || val === false) {
			return false;
		}

		return val;
	}, z.boolean({ message }));
}

/**
 * @description Validate date string and convert to `Date` object
 */
export function validateDate(
	message = lang('shared.validation.invalid_date'),
	optional = true,
) {
	const schema = z
		.string()
		.refine((val) => isValidDate(val), { message })
		.transform((val) => stringToDate(val));

	return optional ? schema.optional() : schema;
}

/**
 * @description Validate enum value
 */
export function validateEnum<T extends Record<string, string>>(
	enumObj: T,
	message: string,
) {
	return z.enum(enumObj, { message });
}

/**
 * @description Build a string schema with a minimum length.
 */
export function validateStringMin(
	messageInvalid: string,
	min: number,
	messageMin: string,
) {
	return z
		.string({ message: messageInvalid })
		.min(min, { message: messageMin });
}

/**
 * @description Build a find validator
 */
export function makeFindValidator<
	TOrderBy extends Record<string, string>,
	TDirection extends Record<string, string>,
	TFilter extends z.ZodRawShape,
>(options: {
	orderByEnum: TOrderBy;
	defaultOrderBy: TOrderBy[keyof TOrderBy];
	directionEnum: TDirection;
	defaultDirection: TDirection[keyof TDirection];
	defaultLimit: number;
	defaultPage: number;
	filterShape: TFilter;
}) {
	const {
		orderByEnum,
		defaultOrderBy,
		directionEnum,
		defaultDirection,
		defaultLimit,
		defaultPage,
		filterShape,
	} = options;

	return z.object({
		order_by: z.enum(orderByEnum).optional().default(defaultOrderBy),

		direction: z.enum(directionEnum).optional().default(defaultDirection),

		limit: z.coerce
			.number({ message: lang('shared.validation.invalid_number') })
			.min(1)
			.optional()
			.default(defaultLimit),

		page: z.coerce
			.number({ message: lang('shared.validation.invalid_number') })
			.min(1)
			.optional()
			.default(defaultPage),

		filter: makeJsonFilterSchema(filterShape),
	});
}

type AddressFields = {
	address_country?: number;
	address_region?: number;
	address_city?: number;
};

export const validateAddressPlaceTypes =
	() => async (data: AddressFields, ctx: z.RefinementCtx) => {
		const checks: Array<{
			field: keyof AddressFields;
			type: PlaceTypeEnum;
			error: string;
		}> = [
			{
				field: 'address_country',
				type: PlaceTypeEnum.COUNTRY,
				error: lang('place.validation.address_country_invalid'),
			},
			{
				field: 'address_region',
				type: PlaceTypeEnum.REGION,
				error: lang('place.validation.address_region_invalid'),
			},
			{
				field: 'address_city',
				type: PlaceTypeEnum.CITY,
				error: lang('place.validation.address_city_invalid'),
			},
		];

		for (const check of checks) {
			const id = data[check.field];

			if (!id) {
				continue;
			}

			const isValid = await getPlaceRepository().checkPlaceType(
				id,
				check.type,
			);

			if (!isValid) {
				ctx.addIssue({
					path: [check.field],
					code: 'custom',
					message: check.error,
				});
			}
		}
	};

export const validateMeta = () =>
	z.object({
		title: validateString(lang('shared.validation.meta_title_invalid')),
		description: validateString(
			lang('shared.validation.meta_description_invalid'),
		).optional(),
		keywords: validateString(
			lang('shared.validation.meta_keywords_invalid'),
		).optional(),
	});

export const validateLanguage = () =>
	z.string().length(2, {
		message: lang('shared.validation.language_invalid'),
	});

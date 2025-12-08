import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { cfg } from '@/config/settings.config';
import BadRequestError from '@/exceptions/bad-request.error';
import { isValidDate, stringToDate } from '@/helpers/date.helper';

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
				throw new BadRequestError(lang('error.invalid_filter'));
			}),
		z.object(shape),
	);
}

/**
 * @description Make string nullable and optional
 */
export function nullableString(msg: string) {
	return z.preprocess(
		(v) => (v === '' ? null : v),
		z.string({ message: msg }).nullable().optional(),
	);
}

/**
 * @description Used in validators to make string required
 */
export function validateString(message: string) {
	return z.string({ message }).nonempty({ message });
}

/**
 * @description Convert string to boolean & validate
 */
export function validateBoolean(message = lang('error.invalid_boolean')) {
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
 * @description Validate date string & convert to Date object
 */
export function validateDate(
	message = lang('error.invalid_date'),
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
	return z.nativeEnum(enumObj, { message });
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
	filterShape: TFilter;
}) {
	const {
		orderByEnum,
		defaultOrderBy,
		directionEnum,
		defaultDirection,
		filterShape,
	} = options;

	return z.object({
		order_by: z.nativeEnum(orderByEnum).optional().default(defaultOrderBy),

		direction: z
			.nativeEnum(directionEnum)
			.optional()
			.default(defaultDirection),

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

		filter: makeJsonFilterSchema(filterShape)
			.optional()
			.default(buildEmptyDefault(filterShape)),
	});
}

/**
 * @description Utility function used to create an object with all keys = undefined so it can be used as default
 */
function buildEmptyDefault(shape: z.ZodRawShape) {
	return Object.fromEntries(
		Object.keys(shape).map((k) => [k, undefined]),
	) as Record<keyof typeof shape, undefined>;
}

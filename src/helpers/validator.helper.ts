import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';

export function parseJsonFilter(
	val: unknown,
	onError: (val: string) => unknown,
) {
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

export function nullableString(msg: string) {
	return z.preprocess(
		(v) => (v === '' ? null : v),
		z.string({ message: msg }).nullable().optional(),
	);
}

export function makeJsonFilterSchema<T extends z.ZodRawShape>(shape: T) {
	return z.preprocess(
		(val) =>
			parseJsonFilter(val, () => {
				throw new BadRequestError(lang('error.invalid_filter'));
			}),
		z.object(shape),
	);
}

export function booleanFromString(message = lang('error.invalid_boolean')) {
	return z.preprocess((val) => {
		if (val === 'true' || val === true) return true;
		if (val === 'false' || val === false) return false;
		return val; // let zod handle invalid cases
	}, z.boolean({ message }));
}

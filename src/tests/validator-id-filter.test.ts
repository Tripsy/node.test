import { expect } from '@jest/globals';
import { BrandValidator } from '@/features/brand/brand.validator';

/**
 * `validateIdFilter` is what lets a caller holding several ids resolve them in one request —
 * the bundle form naming its components, the discount view naming its targets. It is exercised
 * through a feature's real `find` schema rather than in isolation, because the behavior that
 * matters is what survives `qs`: a repeated `filter[id][]` arrives as an array, a single one as
 * a bare value, and both have to reach the query as a list.
 */
const validator = new BrandValidator('brand');

const parseFilter = (id: unknown) =>
	validator.find.safeParse({ filter: { id } });

describe('BaseValidator.validateIdFilter', () => {
	it('accepts several ids', () => {
		const validated = parseFilter(['3', '9']);

		expect(validated.success).toBe(true);
		expect(validated.data?.filter.id).toEqual([3, 9]);
	});

	it('wraps a single id, which `qs` hands over unwrapped', () => {
		const validated = parseFilter('7');

		expect(validated.success).toBe(true);
		expect(validated.data?.filter.id).toEqual([7]);
	});

	it('leaves the filter absent when no id is sent', () => {
		const validated = validator.find.safeParse({ filter: {} });

		expect(validated.success).toBe(true);
		expect(validated.data?.filter.id).toBeUndefined();
	});

	it.each([
		['an empty list', []],
		['a zero id', ['0']],
		['a negative id', ['-1']],
		['a non-numeric id', ['abc']],
	])('rejects %s', (_label, id) => {
		expect(parseFilter(id).success).toBe(false);
	});
});

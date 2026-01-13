import { jest } from '@jest/globals';
import { discountValidator } from '@/features/discount/discount.validator';
import { discountPayloads } from '@/features/discount/tests/discount.mock';
import {
	addDebugValidated,
	validatorPayload,
} from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof discountValidator,
	'create' | 'update' | 'find'
>;

const validator = 'DiscountValidator';
const listSchemas: ValidatorMethod[] = ['create', 'update', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = discountValidator[n]();
			const payload = validatorPayload(discountPayloads, n);
			const validated = schema.safeParse(payload);

			try {
				expect(validated.success).toBe(true);
			} catch (error) {
				addDebugValidated(validated, `${validator} - ${n}`);

				throw error; // Re-throw to fail the test
			}
		});
	});
});

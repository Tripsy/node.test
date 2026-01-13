import { jest } from '@jest/globals';
import { categoryValidator } from '@/features/category/category.validator';
import { categoryPayloads } from '@/features/category/tests/category.mock';
import {
	addDebugValidated,
	validatorPayload,
} from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof categoryValidator,
	'create' | 'update' | 'read' | 'find' | 'statusUpdate'
>;

const validator = 'CategoryValidator';
const listSchemas: ValidatorMethod[] = [
	'create',
	'update',
	'read',
	'find',
	'statusUpdate',
];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = categoryValidator[n]();
			const payload = validatorPayload(categoryPayloads, n);
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

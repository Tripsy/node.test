import { jest } from '@jest/globals';
import { userPayloads } from '@/features/user/tests/user.mock';
import { userValidator } from '@/features/user/user.validator';
import {
	addDebugValidated,
	validatorPayload,
} from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof userValidator,
	'create' | 'update' | 'find'
>;

const validator = 'UserValidator';
const listSchemas: ValidatorMethod[] = ['create', 'update', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = userValidator[n]();
			const payload = validatorPayload(userPayloads, n);
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

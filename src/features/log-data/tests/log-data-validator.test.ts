import { jest } from '@jest/globals';
import { logDataValidator } from '@/features/log-data/log-data.validator';
import { logDataInputPayloads } from '@/features/log-data/tests/log-data.mock';
import {
	addDebugValidated,
} from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<typeof logDataValidator, 'find'>;

const validator = 'LogDataValidator';
const listSchemas: ValidatorMethod[] = ['find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = logDataValidator[n]();
			const payload = logDataInputPayloads.get(n);
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

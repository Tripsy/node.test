import { jest } from '@jest/globals';
import {AccountValidator, accountValidator} from '@/features/account/account.validator';
import { accountInputPayloads } from '@/features/account/tests/account.mock';
import {
    addDebugValidated, createValidatorPayloads,
} from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof accountValidator,
	| 'register'
	| 'login'
	| 'passwordRecover'
	| 'passwordRecoverChange'
	| 'passwordUpdate'
	| 'emailConfirmSend'
	| 'emailUpdate'
	| 'removeToken'
	| 'meEdit'
	| 'meDelete'
>;

const validator = 'AccountValidator';
const listSchemas: ValidatorMethod[] = [
	'register',
	'login',
	'passwordRecover',
	'passwordRecoverChange',
	'passwordUpdate',
	'emailConfirmSend',
	'emailUpdate',
	'removeToken',
	'meEdit',
	'meDelete',
];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = accountValidator[n]();
			const payload = accountInputPayloads.get(n);
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

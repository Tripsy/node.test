import { jest } from '@jest/globals';
import { accountValidator } from '@/features/account/account.validator';
import { accountPayloads } from '@/features/account/tests/account.mock';
import {
	addDebugValidated,
	validatorPayload,
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
			const payload = validatorPayload(accountPayloads, n);
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

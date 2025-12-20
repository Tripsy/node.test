import { AccountRegisterValidator } from '@/features/account/account.validator';

const createParseData = () => ({
	name: 'John Doe',
	email: 'johndoe@example.com',
	password: 'StrongP@ssw0rd',
	password_confirm: 'StrongP@ssw0rd',
	language: 'en',
});

describe('AccountRegisterValidator', () => {
	it('should validate a correct input', () => {
		const testData = createParseData();
		expect(() => AccountRegisterValidator().parse(testData)).not.toThrow();
	});

	it('should fail if name is too short', () => {
		const testData = createParseData();
		testData.name = 'J';

		expect(() => AccountRegisterValidator().parse(testData)).toThrow(
			/account.validation.name_min/,
		);
	});

	it('should fail if email is invalid', () => {
		const testData = createParseData();
		testData.email = 'invalid-email';

		expect(() => AccountRegisterValidator().parse(testData)).toThrow(
			/account.validation.email_invalid/,
		);
	});

	it('should fail if password is too short', () => {
		const testData = createParseData();
		testData.password = 'Ab!';

		expect(() => AccountRegisterValidator().parse(testData)).toThrow(
			/account.validation.password_min/,
		);
	});

	it('should fail if password lacks a capital letter', () => {
		const testData = createParseData();
		testData.password = 'weakpassword1!';

		expect(() => AccountRegisterValidator().parse(testData)).toThrow(
			/account.validation.password_condition_capital_letter/,
		);
	});

	it('should fail if password lacks a number', () => {
		const testData = createParseData();
		testData.password = 'StrongPassword!';

		expect(() => AccountRegisterValidator().parse(testData)).toThrow(
			/account.validation.password_condition_number/,
		);
	});

	it('should fail if password lacks a special character', () => {
		const testData = createParseData();
		testData.password = 'StrongPassword1';

		expect(() => AccountRegisterValidator().parse(testData)).toThrow(
			/account.validation.password_condition_special_character/,
		);
	});

	it('should fail if password confirmation does not match', () => {
		const testData = createParseData();
		testData.password_confirm = 'WrongP@ssw0rd';

		expect(() => AccountRegisterValidator().parse(testData)).toThrow(
			/account.validation.password_confirm_mismatch/,
		);
	});
});

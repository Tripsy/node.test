import {AccountRegisterValidator} from "@/features/account/account.validator";

const testData = {
	name: 'John Doe',
	email: 'johndoe@example.com',
	password: 'StrongP@ssw0rd',
	password_confirm: 'StrongP@ssw0rd',
	language: 'en',
};

describe('AccountRegisterValidator', () => {
	it('should validate a correct input', () => {
		expect(() => AccountRegisterValidator.parse(testData)).not.toThrow();
	});

	it('should fail if name is too short', () => {
		jest.replaceProperty(testData, 'name', 'J');

		expect(() => AccountRegisterValidator.parse(testData)).toThrow(
			/account.validation.name_min/,
		);
	});

	it('should fail if email is invalid', () => {
		jest.replaceProperty(testData, 'email', 'invalid-email');

		expect(() => AccountRegisterValidator.parse(testData)).toThrow(
			/account.validation.email_invalid/,
		);
	});

	it('should fail if password is too short', () => {
		jest.replaceProperty(testData, 'password', 'Ab!');

		expect(() => AccountRegisterValidator.parse(testData)).toThrow(
			/account.validation.password_min/,
		);
	});

	it('should fail if password lacks a capital letter', () => {
		jest.replaceProperty(testData, 'password', 'weakpassword1!');

		expect(() => AccountRegisterValidator.parse(testData)).toThrow(
			/account.validation.password_condition_capital_letter/,
		);
	});

	it('should fail if password lacks a number', () => {
		jest.replaceProperty(testData, 'password', 'StrongPassword!');

		expect(() => AccountRegisterValidator.parse(testData)).toThrow(
			/account.validation.password_condition_number/,
		);
	});

	it('should fail if password lacks a special character', () => {
		jest.replaceProperty(testData, 'password', 'StrongPassword1');

		expect(() => AccountRegisterValidator.parse(testData)).toThrow(
			/account.validation.password_condition_special_character/,
		);
	});

	it('should fail if password confirmation does not match', () => {
		jest.replaceProperty(testData, 'password_confirm', 'WrongP@ssw0rd');

		expect(() => AccountRegisterValidator.parse(testData)).toThrow(
			/account.validation.password_confirm_mismatch/,
		);
	});
});

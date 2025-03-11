import AccountRegisterValidator from '../../validators/account-register.validator';

const initTestData = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    password: 'StrongP@ssw0rd',
    password_confirm: 'StrongP@ssw0rd',
    language: 'en',
};

describe('AccountRegisterValidator', () => {
    it('should validate a correct input', () => {
        const testData = {...initTestData};

        expect(() => AccountRegisterValidator.parse(testData)).not.toThrow();
    });

    it('should fail if name is too short', () => {
        const testData = {...initTestData};

        testData.name = 'J';

        expect(() => AccountRegisterValidator.parse(testData)).toThrow(
            new RegExp('user.validation.name_min')
        );
    });


    it('should fail if email is invalid', () => {
        const testData = {...initTestData};

        testData.email = 'invalid-email';

        expect(() => AccountRegisterValidator.parse(testData)).toThrow(
            new RegExp('user.validation.email_invalid')
        );
    });

    it('should fail if password is too short', () => {
        const testData = {...initTestData};

        testData.password = 'Ab!';

        expect(() => AccountRegisterValidator.parse(testData)).toThrow(
            new RegExp('user.validation.password_min')
        );
    });

    it('should fail if password lacks a capital letter', () => {
        const testData = {...initTestData};

        testData.password = 'weakpassword1!';

        expect(() => AccountRegisterValidator.parse(testData)).toThrow(
            new RegExp('user.validation.password_condition_capital_letter')
        );
    });

    it('should fail if password lacks a number', () => {
        const testData = {...initTestData};

        testData.password = 'StrongPassword!';

        expect(() => AccountRegisterValidator.parse(testData)).toThrow(
            new RegExp('user.validation.password_condition_number')
        );
    });

    it('should fail if password lacks a special character', () => {
        const testData = {...initTestData};

        testData.password = 'StrongPassword1';

        expect(() => AccountRegisterValidator.parse(testData)).toThrow(
            new RegExp('user.validation.password_condition_special_character')
        );
    });

    it('should fail if password confirmation does not match', () => {
        const testData = {...initTestData};

        testData.password_confirm = 'WrongP@ssw0rd';

        expect(() => AccountRegisterValidator.parse(testData)).toThrow(
            new RegExp('user.validation.password_confirm_mismatch')
        );
    });
});
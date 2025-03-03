import {
    createFutureDate, createPastDate, dateDiffInSeconds,
    dateToString,
    isValidDate,
    isValidDateInstance, isValidIp, replaceTemplateVars,
    stringToDate
} from '../../helpers/utils.helper';

describe('helpers/utils.helper.ts - Unit Tests', () => {
    describe('isValidIp', () => {
        test('should return true for valid IPv4 addresses', () => {
            expect(isValidIp('192.168.1.1')).toBe(true);
            expect(isValidIp('10.0.0.1')).toBe(true);
            expect(isValidIp('172.16.0.1')).toBe(true);
            expect(isValidIp('255.255.255.255')).toBe(true);
            expect(isValidIp('0.0.0.0')).toBe(true);
        });

        test('should return false for invalid IPv4 addresses', () => {
            expect(isValidIp('256.256.256.256')).toBe(false); // Out of range
            expect(isValidIp('192.168.1.999')).toBe(false); // Out of range
            expect(isValidIp('192.168.1')).toBe(false); // Incomplete
            expect(isValidIp('192.168.1.1.1')).toBe(false); // Too many octets
            expect(isValidIp('abc.def.gha.bcd')).toBe(false); // Non-numeric
        });

        test('should return true for valid IPv6 addresses', () => {
            expect(isValidIp('2001:db8::ff00:42:8329')).toBe(true);
            expect(isValidIp('::1')).toBe(true);
            expect(isValidIp('fe80::1')).toBe(true);
            expect(isValidIp('::')).toBe(true);
            expect(isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
        });

        test('should return false for invalid IPv6 addresses', () => {
            expect(isValidIp('2001:db8:::ff00:42:8329')).toBe(false); // Extra colon
            expect(isValidIp('gggg::ffff')).toBe(false); // Invalid hex characters
            expect(isValidIp('12345::6789')).toBe(false); // Too many characters in a section
            expect(isValidIp('1.1.1.1.1')).toBe(false); // Looks like IPv4 but wrong format
        });

        test('should return false for random non-IP strings', () => {
            expect(isValidIp('hello world')).toBe(false);
            expect(isValidIp('not.an.ip')).toBe(false);
            expect(isValidIp('192.168.abc.def')).toBe(false);
        });
    });

    describe('isValidDate', () => {
        it('should return true for a valid date string', () => {
            const validDateString = '2023-10-01T12:00:00.000Z';

            expect(isValidDate(validDateString)).toBe(true);
        });

        it('should return false for an invalid date string', () => {
            const invalidDateString = 'invalid-date';

            expect(isValidDate(invalidDateString)).toBe(false);
        });
    });

    describe('isValidDateInstance', () => {
        it('should return true for a valid Date object', () => {
            const validDate = new Date('2023-10-01T12:00:00.000Z');

            expect(isValidDateInstance(validDate)).toBe(true);
        });

        it('should return false for an invalid Date object', () => {
            const invalidDate = new Date('invalid-date');

            expect(isValidDateInstance(invalidDate)).toBe(false);
        });
    });

    describe('stringToDate', () => {
        it('should convert a valid date string to a Date object', () => {
            const dateString = '2023-10-01T12:00:00.000Z';
            const result = stringToDate(dateString);

            expect(result).toBeInstanceOf(Date);
            expect(result.toISOString()).toBe(dateString);
        });

        it('should throw an error for an invalid date string', () => {
            const invalidDateString = 'invalid-date';

            expect(() => stringToDate(invalidDateString)).toThrow(`Invalid date (eg: ${invalidDateString})`);
        });
    });

    describe('dateToString', () => {
        it('should convert a Date object to an ISO string', () => {
            const date = new Date('2023-10-01T12:00:00.000Z');

            expect(dateToString(date)).toBe('2023-10-01T12:00:00.000Z');
        });

        it('should throw an error if for invalid date', () => {
            const invalidDate = new Date('invalid-date');

            expect(() => dateToString(invalidDate)).toThrow(`Invalid date`);
        });
    });

    describe('createFutureDate', () => {
        it('should create a future date by adding seconds to the current date', () => {
            const currentDate = new Date();
            const seconds = 60;
            const futureDate = createFutureDate(seconds);

            const expectedTime = currentDate.getTime() + seconds * 1000;

            expect(futureDate.getTime()).toBe(expectedTime);
        });

        it('should throw an error if seconds is a negative number', () => {
            const seconds = -60;

            expect(() => createFutureDate(seconds)).toThrow('Seconds should a positive number greater than 0');
        });
    });

    describe('createPastDate', () => {
        it('should create a past date by subtracting seconds from the current date', () => {
            const currentDate = new Date();
            const seconds = 60;
            const pastDate = createPastDate(seconds);

            const expectedTime = currentDate.getTime() - seconds * 1000;

            expect(pastDate.getTime()).toBe(expectedTime);
        });

        it('should throw an error if seconds is a negative number', () => {
            const seconds = -60;

            expect(() => createPastDate(seconds)).toThrow('Seconds should a positive number greater than 0');
        });
    });

    describe('replaceTemplateVars', () => {
        it('should replace template variables with provided values', () => {
            const content = 'Hello, {{name}}! Welcome to {{place}}.';
            const vars = {name: 'John', place: 'Earth'};

            expect(replaceTemplateVars(content, vars)).toBe('Hello, John! Welcome to Earth.');
        });

        it('should leave unmatched template variables unchanged', () => {
            const content = 'Hello, {{name}}! Welcome to {{place}}.';
            const vars = {name: 'John'}; // 'place' is missing

            expect(replaceTemplateVars(content, vars)).toBe('Hello, John! Welcome to {{place}}.');
        });

        it('should leave all template variables unchanged if no variables are provided', () => {
            const content = 'Hello, {{name}}! Welcome to {{place}}.';

            expect(replaceTemplateVars(content)).toBe('Hello, {{name}}! Welcome to {{place}}.');
        });
    });

    describe('dateDiffInSeconds', () => {
        it('should calculate the difference between two dates in seconds', () => {
            const date1 = new Date('2023-10-01T12:00:00.000Z');
            const date2 = new Date('2023-10-01T12:00:30Z');

            expect(dateDiffInSeconds(date1, date2)).toBe(-30); // date1 is earlier than date2
        });

        it('should handle the same date and return 0', () => {
            const date1 = new Date('2023-10-01T12:00:00.000Z');
            const date2 = new Date('2023-10-01T12:00:00.000Z');

            expect(dateDiffInSeconds(date1, date2)).toBe(0);
        });

        it('should throw an error for invalid date1', () => {
            const date1 = new Date('invalid-date');
            const date2 = new Date('2023-10-01T12:00:00.000Z');

            expect(() => dateDiffInSeconds(date1, date2)).toThrow('Invalid date (eg: date1)');
        });

        it('should throw an error for invalid date2', () => {
            const date1 = new Date('2023-10-01T12:00:00.000Z');
            const date2 = new Date('invalid-date');

            expect(() => dateDiffInSeconds(date1, date2)).toThrow('Invalid date (eg: date2)');
        });
    });
});
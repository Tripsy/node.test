import moment from 'moment';

/**
 * Check if a string is a valid date
 *
 * @param {string} date - The date string to check
 * @returns {boolean} - True if the date is valid, false otherwise
 */
export function isValidDate(date: string): boolean {
    const parsedDate = new Date(date);

    return !isNaN(parsedDate.getTime());
}

/**
 * Checks if a value is a valid Date object
 * @param date - The value to check
 * @returns `true` if the value is a valid Date object, `false` otherwise
 */
export function isValidDateInstance(date: unknown): date is Date {
    return (
        date instanceof Date &&
        !isNaN(date.getTime()) &&
        date.toString() !== 'Invalid Date'
    );
}

/**
 * Converts a date string to a Date object with strict validation
 *
 * @param dateString - The date string to convert (ISO 8601, RFC 2822, or other supported formats)
 * @returns Valid Date object
 * @throws {Error} If the input is not a valid date string or cannot be parsed
 */
export function stringToDate(dateString: string | null): Date | null {
    if (!dateString) {
        return null;
    }

    const trimmedString = dateString.trim();

    if (!trimmedString) {
        return null;
    }

    // Special handling for ISO 8601 date-only format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedString)) {
        const [year, month, day] = trimmedString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        if (!isValidDateInstance(date)) {
            throw new Error(`Invalid ISO date: ${trimmedString}`);
        }

        return date;
    }

    // General date parsing
    const parsedDate = new Date(trimmedString);

    if (!isValidDateInstance(parsedDate)) {
        throw new Error(`Invalid date format: ${trimmedString}`);
    }

    // Additional validation for non-ISO formats
    if (parsedDate.toString() === 'Invalid Date') {
        throw new Error(`Unparsable date: ${trimmedString}`);
    }

    return parsedDate;
}

/**
 * Create a future date by adding seconds to the current date
 *
 * @param {number} seconds - The number of seconds to add
 * @returns {Date} - The future date
 * @throws {Error} - If seconds is a negative number
 */
export function createFutureDate(seconds: number): Date {
    if (seconds <= 0) {
        throw new Error('Seconds should a positive number greater than 0');
    }

    const currentDate = new Date();

    return new Date(currentDate.getTime() + seconds * 1000);
}

/**
 * Create a past date by subtracting seconds from the current date
 *
 * @param {number} seconds - The number of seconds to subtract
 * @returns {Date} - The past date
 * @throws {Error} - If seconds is a negative number
 */
export function createPastDate(seconds: number): Date {
    if (seconds <= 0) {
        throw new Error('Seconds should a positive number greater than 0');
    }

    const currentDate = new Date();

    return new Date(currentDate.getTime() - seconds * 1000);
}

/**
 * Calculate the difference between two dates in seconds
 *
 * @param {Date} date1 - The first date
 * @param {Date} date2 - The second date
 * @returns {number} - The difference in seconds
 * @throws {Error} - If either date is invalid
 */
export function dateDiffInSeconds(date1: Date, date2: Date): number {
    if (!isValidDateInstance(date1)) {
        throw new Error('Invalid date (eg: date1)');
    }

    if (!isValidDateInstance(date2)) {
        throw new Error('Invalid date (eg: date2)');
    }

    return Math.ceil((date1.getTime() - date2.getTime()) / 1000);
}

/**
 * Return the `date` if it is a valid `Date` instance, otherwise return `undefined`.
 *
 * @param date
 */
export function getValidDate(date: unknown): Date | undefined {
    return isValidDateInstance(date) ? date : undefined;
}

/**
 * Universal date formatter with Moment.js
 *
 * @param value - Date input (string, Date, null, undefined)
 * @param format - Output format (or preset: 'iso', 'local', etc.)
 * @param options - { strict: boolean }
 * @returns Formatted string or null
 */
export function formatDate(
    value: string | Date | null | undefined,
    format: string | 'iso' | 'local' = 'iso',
    options: { strict?: boolean } = {}
): string | null {
    // Handle empty values
    if (value === null || value === undefined) {
        if (options.strict) {
            throw new Error('Invalid date: null/undefined');
        }

        return null;
    }

    // Create moment object
    const date = moment(value);

    // Validate date
    if (!date.isValid()) {
        if (options.strict) {
            throw new Error(`Invalid date: ${value}`);
        }

        return null;
    }

    // Apply formatting
    switch (format) {
        case 'iso':
            return date.format('YYYY-MM-DD');
        case 'iso-full':
            return date.toISOString();
        case 'local':
            return date.format('MM/DD/YYYY');
        case 'local-full':
            return date.format('MM/DD/YYYY, hh:mm:ss A');
        default:
            return date.format(format);
    }
}
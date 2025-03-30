import net from 'net';
import moment from 'moment';

/**
 * Check if a string is a valid IP address
 *
 * @param {string} ip - The IP address to check
 * @returns {boolean} - True if the IP address is valid, false otherwise
 */
export function isValidIp(ip: string): boolean {
    return net.isIP(ip) !== 0; // Returns 4 for IPv4, 6 for IPv6, and 0 for invalid
}

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
 * Check if a Date object is valid
 *
 * @param {Date} date - The Date object to check
 * @returns {boolean} - True if the Date object is valid, false otherwise
 */
export function isValidDateInstance(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Convert a date string to a Date object
 *
 * @param {string} dateString - The date string to convert
 * @returns {Date} - The Date object
 * @throws {Error} - If the date string does not represent a valid date
 */
export function stringToDate(dateString: string): Date {
    const parsedDate = new Date(dateString);

    if (!isValidDateInstance(parsedDate)) {
        throw new Error(`Invalid date (eg: ${dateString})`);
    }

    return parsedDate;
}

/**
 * Convert a Date object to an ISO string
 *
 * @param {Date} date - The Date object to convert
 * @param format
 * @returns {string} - The ISO string
 * @throws {Error} - If the Date object is invalid
 */
export function dateToString(date: Date, format?: string): string {
    if (!isValidDateInstance(date)) {
        throw new Error(`Invalid date`);
    }

    if (format) {
        return moment(date).format(format);
    }

    return date.toISOString();
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
 * Replace variables in a string
 * Ex variables: {{key}}, {{Key}}, {{sub_key}}, {{key1}}
 *
 * @param {string} content - The string to replace template variables in
 * @param {Record<string, string>} vars - The template variables to replace
 * @returns {string} - The string with template variables replaced
 */
export function replaceVars(content: string, vars: Record<string, string> = {}): string {
    return content.replace(/{{(\w+)}}/g, (_, key) => (key in vars ? vars[key] : `{{${key}}}`));
}

/**
 * Get the value of a key in an object
 * ex: key = "user.create"
 *
 * @param {Record<string, any>} obj - The object to get the value from
 * @param {string} key - The key to get the value of
 * @returns {any} - The value of the key
 */
export function getObjectValue(obj: Record<string, any>, key: string): any {
    return key.split('.').reduce((acc, part) => acc && acc[part], obj);
}
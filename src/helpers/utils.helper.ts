import net from 'net';

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
import net from 'node:net';
import sanitizeHtml from 'sanitize-html';

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
export function replaceVars(
	content: string,
	vars: Record<string, string> = {},
): string {
	return content.replace(/{{(\w+)}}/g, (_, key) =>
		key in vars ? vars[key] : `{{${key}}}`,
	);
}

export type ObjectValue =
	| string
	| number
	| boolean
	| Date
	| RegExp
	| null
	| undefined
	| ObjectValue[]
	| { [key: string]: ObjectValue };

/**
 * Get the value of a key in an object
 * ex: key = "user.create"
 *
 * @param {Record<string, any>} obj - The object to get the value from
 * @param {string} key - The key to get the value of
 * @returns {any} - The value of the key
 */
export function getObjectValue(
	obj: { [key: string]: ObjectValue },
	key: string,
): ObjectValue | undefined {
	return key.split('.').reduce<ObjectValue | undefined>((acc, part) => {
		if (
			acc &&
			typeof acc === 'object' &&
			!Array.isArray(acc) &&
			part in acc
		) {
			return (acc as { [key: string]: ObjectValue })[part];
		}
		return undefined;
	}, obj);
}

/**
 * Set the value of a key in an object
 * ex: key = "user.create", value = "new value"
 *
 * @param {Record<string, any>} obj - The object to set the value in
 * @param {string} key - The key to set the value for
 * @param {ObjectValue} value - The value to set
 * @returns {boolean} - Whether the value was successfully set
 */
export function setObjectValue(
	obj: { [key: string]: ObjectValue },
	key: string,
	value: ObjectValue,
): boolean {
	const parts = key.split('.');
	const lastPart = parts.pop();

	if (!lastPart) {
		return false;
	}

	const parent = parts.reduce<ObjectValue | undefined>((acc, part) => {
		if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
			if (!(part in acc)) {
				(acc as { [key: string]: ObjectValue })[part] = {};
			}
			return (acc as { [key: string]: ObjectValue })[part];
		}
		return undefined;
	}, obj);

	if (parent && typeof parent === 'object' && !Array.isArray(parent)) {
		(parent as { [key: string]: ObjectValue })[lastPart] = value;
		return true;
	}

	return false;
}

export function hasAtLeastOneValue(obj: unknown): boolean {
	if (obj === null || obj === undefined) return false;

	if (typeof obj !== 'object') {
		return true;
	}

	// For arrays: treat values like a normal object
	const values = Object.values(obj);

	// No keys → empty
	if (values.length === 0) {
		return false;
	}

	// Check children
	return values.some((v) => hasAtLeastOneValue(v));
}

export function safeHtml(dirtyHtml: string): string {
	return sanitizeHtml(dirtyHtml, {
		allowedTags: [
			'p',
			'br',
			'strong',
			'em',
			'i',
			'b',
			'u',
			'span',
			'div',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'ul',
			'ol',
			'li',
			'blockquote',
			'code',
			'pre',
			'a',
			'img',
			'table',
			'thead',
			'tbody',
			'tr',
			'th',
			'td',
		],
		allowedAttributes: {
			a: ['href', 'title', 'target'],
			img: ['src', 'alt', 'width', 'height'],
		},
		disallowedTagsMode: 'discard',
		allowedSchemes: ['http', 'https', 'mailto'],
		allowProtocolRelative: false,
	});
}

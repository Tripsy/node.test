import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Request } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_PATH = path.resolve(__dirname, '../../');
export const SRC_PATH = path.resolve(ROOT_PATH, 'src');

export function buildRootPath(...args: string[]) {
	return path.join(ROOT_PATH, ...args);
}

export function buildSrcPath(...args: string[]) {
	return path.join(SRC_PATH, ...args);
}

export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Check if a string is a valid IP address
 *
 * @param {string} ip - The IP address to check
 * @returns {boolean} - True if the IP address is valid, false otherwise
 */
export function isValidIp(ip: string): boolean {
	return net.isIP(ip) !== 0; // Returns 4 for IPv4, 6 for IPv6, and 0 for invalid
}

export function getClientIp(req: Request): string {
	const reqXForwardedFor = (req.headers['x-forwarded-for'] as string)
		?.split(',')[0]
		.trim()
		.replace(/^::ffff:/, '');

	if (isValidIp(reqXForwardedFor)) {
		return reqXForwardedFor;
	}

	const reqIp = req.ip?.replace(/^::ffff:/, '') || '';

	if (isValidIp(reqIp)) {
		return reqIp;
	}

	return 'n/a';
}

export function listDirectories(originPath: string): string[] {
	const stat = fs.statSync(originPath);

	if (!stat.isDirectory()) {
		throw new Error(
			`Cannot list folders. Origin path is not a directory: ${originPath}`,
		);
	}

	return fs
		.readdirSync(originPath, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.filter((dirent) => !dirent.name.startsWith('.')) // Skip hidden directories
		.map((dirent) => dirent.name);
}

export function listFiles(originPath: string): string[] {
	const stat = fs.statSync(originPath);

	if (!stat.isDirectory()) {
		throw new Error(
			`Cannot list files. Origin path is not a directory: ${originPath}`,
		);
	}

	return fs
		.readdirSync(originPath, { withFileTypes: true })
		.filter((dirent) => dirent.isFile())
		.filter((dirent) => !dirent.name.startsWith('.')) // Skip hidden files
		.map((dirent) => dirent.name);
}

export function getFileNameWithoutExtension(s: string): string {
	const match = path.basename(s).match(/^([\w-]+)/);

	return match ? match[1] : 'unknown';
}

import net from 'node:net';
import path from 'node:path';
import type { Request } from 'express';
import { cfg } from '@/config/settings.config';

export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function buildPath(...args: string[]): string {
	return path.join(...args);
}

export function buildRootPath(...args: string[]): string {
	return buildPath(cfg('app.rootPath') as string, ...args);
}

export function buildSrcPath(...args: string[]): string {
	return buildPath(cfg('app.srcPath') as string, ...args);
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

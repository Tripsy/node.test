import 'dotenv/config';
import type { LogDataLevelEnum } from '@/features/log-data/log-data.entity';
import { getObjectValue, type ObjectValue, setObjectValue } from '@/helpers';

function getSettings(): { [key: string]: ObjectValue } {
	return {
		app: {
			env: process.env.APP_ENV || 'developmƒent',
			debug: process.env.APP_DEBUG === 'true',
			url: process.env.APP_URL || 'http://node.test',
			port: parseInt(process.env.APP_PORT || '3000', 10),
			rootPath: process.env.ROOT_PATH || '/var/www/html',
			srcPath: process.env.SRC_PATH || '/var/www/html/src',
			name: process.env.APP_NAME || 'sample-node-api',
			email: process.env.APP_EMAIL || 'hello@example.com',
			timezone: process.env.APP_TIMEZONE || 'UTC',
			language: process.env.APP_LANG || 'en',
			languageSupported: (process.env.APP_LANGUAGE_SUPPORTED || 'en')
				.trim()
				.split(','),
			languageNamespaces: [
				'account',
				'carrier',
				'cron_history',
				'debug',
                'discount',
				'error',
				'log_data',
				'mail_queue',
				'permission',
				'template',
				'user',
				'user_permission',
			],
		},
		frontend: {
			url: process.env.FRONTEND_URL || 'http://nextjs.test',
			name: process.env.FRONTEND_APP_NAME || 'sample-nextjs-client',
		},
		security: {
			allowedOrigins: ['http://nextjs.test'],
		},
		database: {
			connection: process.env.DB_CONNECTION || 'postgres', // mariadb
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '3306', 10),
			username: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD || '',
			name: process.env.DB_DATABASE || 'sample-node-api',
		},
		redis: {
			host: process.env.REDIS_HOST || 'localhost',
			port: parseInt(process.env.REDIS_PORT || '6379', 10),
			password: process.env.REDIS_PASSWORD || '',
		},
		cache: {
			ttl: Number(process.env.CACHE_TTL) || 60,
		},
		/**
		 * For `app.env` === test OR `app.debug` === true logs will always be printed to console
		 * Below log level 30 can only be logged to a file
		 */
		pino: {
			logLevel:
				process.env.PINO_LOG_LEVEL || ('trace' as LogDataLevelEnum),
			levelFile: [
				'debug',
				'info',
				'error',
				'warn',
				'fatal',
			] as LogDataLevelEnum[],
			levelDatabase: [
				'info',
				'error',
				'warn',
				'fatal',
			] as LogDataLevelEnum[],
			levelEmail: ['error', 'fatal'] as LogDataLevelEnum[],
			logEmail: process.env.PINO_LOG_EMAIL || '',
		},
		mail: {
			host: process.env.MAIL_HOST || '127.0.0.1',
			port: parseInt(process.env.MAIL_PORT || '2525', 10),
			encryption: process.env.encryption || 'tls',
			username: process.env.MAIL_USERNAME || '',
			password: process.env.MAIL_PASSWORD || '',
			fromAddress: process.env.MAIL_FROM_ADDRESS || 'hello@example.com',
			fromName: process.env.MAIL_FROM_NAME || 'sample-node-api',
		},
		filter: {
			limit: 20, // Default limit
			termMinLength: 3,
		},
		user: {
			authSecret: (process.env.AUTH_JWT_SECRET as string) || 'secret',
			authExpiresIn: Number(process.env.AUTH_JWT_EXPIRES_IN) || 86400,
			authRefreshExpiresIn:
				Number(process.env.AUTH_JWT_REFRESH_EXPIRES_IN) || 28800, // refresh token if expires before defined interval
			emailConfirmationSecret:
				(process.env.EMAIL_JWT_SECRET as string) || 'secret',
			emailConfirmationExpiresIn:
				Number(process.env.EMAIL_JWT_EXPIRES_IN) || 30, // days
			maxActiveSessions: 2, // maximum number of active sessions per user; on valid login and max number will have to chose to remove old session(s)
			recoveryIdentExpiresIn: 7200, // converted to seconds
			recoveryAttemptsInLastSixHours: 3,
			recoveryEnableMetadataCheck: true, // if set to false, will not check fingerprinting data
			nameMinLength: 3,
			passwordMinLength: 8,
			loginMaxFailedAttemptsForIp: 5,
			loginMaxFailedAttemptsForEmail: 3,
			loginFailedAttemptsLockTime: 900, // block logins for 15 minutes when too many failed attempts
		},
	};
}

/**
 * Enhanced configuration function
 * - Get value: cfg('app.language')
 * - Set value: cfg('app.language', 'en')
 * - Check existence: cfg('app.language', undefined, true) returns boolean
 *
 * @param {string} key - The configuration key
 * @returns {string | boolean | void} - The value, existence boolean, or undefined when setting
 */
export function cfg(key: string): ObjectValue;
// export function cfg(key: string, value: ObjectValue): void;
// export function cfg(key: string, checkOnly: boolean): boolean;
export function cfg(
	key: string,
	value?: ObjectValue,
	checkOnly?: boolean,
): ObjectValue | boolean | undefined {
	const settingsConfig = getSettings();

	if (checkOnly) {
		return getObjectValue(settingsConfig, key) !== undefined;
	}

	// Set mode
	if (value !== undefined) {
		const success = setObjectValue(settingsConfig, key, value);

		if (!success) {
			console.warn(`Failed to set configuration key: ${key}`);
		}

		return;
	}

	// Get mode
	const result = getObjectValue(settingsConfig, key);

	if (result === undefined) {
		console.warn(`Configuration key not found: ${key}`);
	}

	return result;
}

export const isSupportedLanguage = (language: string): boolean => {
	const languages = cfg('app.languageSupported') as string[];

	return Array.isArray(languages) && languages.includes(language);
};

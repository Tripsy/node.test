import 'dotenv/config';
import type { LogDataLevelEnum } from '@/features/log-data/log-data.entity';
import type { LogHistoryDestination } from '@/features/log-history/log-history.entity';
import { getObjectValue, type ObjectValue, setObjectValue } from '@/helpers';

type Settings = { [key: string]: ObjectValue };

let settings: Settings;

function getSettings(): Settings {
	if (!settings) {
		settings = loadSettings();
	}

	return settings;
}

function loadSettings(): Settings {
	return {
		app: {
			env: process.env.APP_ENV || 'development',
			debug: process.env.APP_DEBUG === 'true',
			url: process.env.APP_URL || 'http://nready.dev',
			port: parseInt(process.env.APP_PORT || '3000', 10),
			name: process.env.APP_NAME || 'sample-node-api',
			email: process.env.APP_EMAIL || 'hello@example.com',
			timezone: process.env.APP_TIMEZONE || 'UTC',
			language: process.env.APP_LANG || 'en',
			languageSupported: (process.env.APP_LANGUAGE_SUPPORTED || 'en')
				.trim()
				.split(','),
		},
		folder: {
			features: '/features',
			shared: '/shared',
		},
		frontend: {
			url: process.env.FRONTEND_URL || 'http://nextjs.test',
			name: process.env.FRONTEND_APP_NAME || 'sample-nextjs-client',
		},
		security: {
			allowedOrigins: ['http://nextjs.test'],
		},
		// database: {
		// 	connection: process.env.DB_CONNECTION || 'postgres',
		// 	host: process.env.DB_HOST || 'localhost',
		// 	port: parseInt(process.env.DB_PORT || '3306', 10),
		// 	username: process.env.DB_USER || 'root',
		// 	password: process.env.DB_PASSWORD || '',
		// 	name: process.env.DB_NAME || 'sample-node-api',
		// },
		redis: {
			host: process.env.REDIS_HOST || 'localhost',
			port: parseInt(process.env.REDIS_PORT || '6379', 10),
			password: process.env.REDIS_PASSWORD || '',
		},
		cache: {
			ttl: Number(process.env.CACHE_TTL) ?? 60,
		},
		logging: {
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
			history: process.env.LOGGING_HISTORY as LogHistoryDestination,
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
			limit: 20,
			termMinLength: 3,
		},
		user: {
			authSecret: (process.env.AUTH_JWT_SECRET as string) || 'secret',
			authExpiresIn: Number(process.env.AUTH_JWT_EXPIRES_IN) || 86400,
			authRefreshExpiresIn:
				Number(process.env.AUTH_JWT_REFRESH_EXPIRES_IN) || 28800,
			emailConfirmationSecret:
				(process.env.EMAIL_JWT_SECRET as string) || 'secret',
			emailConfirmationExpiresIn:
				Number(process.env.EMAIL_JWT_EXPIRES_IN) || 30,
			maxActiveSessions: 2,
			recoveryIdentExpiresIn: 7200,
			recoveryAttemptsInLastSixHours: 3,
			recoveryEnableMetadataCheck: true,
			nameMinLength: 3,
			passwordMinLength: 8,
			loginMaxFailedAttemptsForIp: 5,
			loginMaxFailedAttemptsForEmail: 3,
			loginFailedAttemptsLockTime: 900,
		},
	};
}

export const Configuration = {
	get: <T = ObjectValue>(key: string): T | undefined => {
		const value = getObjectValue(getSettings(), key);

		if (value === undefined) {
			console.warn(`Configuration key not found: ${key}`);
		}

		return value as T;
	},

	set: (key: string, value: ObjectValue): void => {
		const success = setObjectValue(getSettings(), key, value);

		if (!success) {
			console.warn(`Failed to set configuration key: ${key}`);
		}
	},

	isSupportedLanguage: (language: string): boolean => {
		const languages = Configuration.get<string[]>('app.languageSupported');

		return Array.isArray(languages) && languages.includes(language);
	},

	environment: () => {
		return Configuration.get('app.env') as string;
	},

	isEnvironment: (value: string) => {
		return Configuration.environment() === value;
	},

	resolveExtension: () => {
		return Configuration.environment() === 'production' ? 'js' : 'ts';
	},
};
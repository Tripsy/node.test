import 'reflect-metadata';
import type { Server } from 'node:http';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import i18next from 'i18next';
import { handle as i18nextMiddleware } from 'i18next-http-middleware';
import { v4 as uuidv4 } from 'uuid';
import { initializeI18next } from '@/config/i18n.setup';
import { redisClose } from '@/config/init-redis.config';
import { initRoutes } from '@/config/routes.setup';
import { cfg } from '@/config/settings.config';
import authMiddleware from '@/middleware/auth.middleware';
import { corsHandler } from '@/middleware/cors-handler.middleware';
import { errorHandler } from '@/middleware/error-handler.middleware';
import languageMiddleware from '@/middleware/language.middleware';
import { notFoundHandler } from '@/middleware/not-found-handler.middleware';
import { outputHandler } from '@/middleware/output-handler.middleware';
import { requestContextMiddleware } from '@/middleware/request-context.middleware';
import startCronJobs from '@/providers/cron.provider';
import { destroyDatabase, initDatabase } from '@/providers/database.provider';
import { LogStream, systemLogger } from '@/providers/logger.provider';
import emailQueue from '@/queues/email.queue';

const app: express.Application = express();
export let server: Server | null = null;

// Configuration
const FORCE_SHUTDOWN_TIMEOUT = Number(
	process.env.FORCE_SHUTDOWN_TIMEOUT ?? 10000,
);
const REQUEST_TIMEOUT = Number(process.env.REQUEST_TIMEOUT) || 30000;
const APP_PORT = Number(cfg('app.port'));
const APP_ENV = cfg('app.env') as string;
const APP_NAME = cfg('app.name') as string;
const APP_URL = cfg('app.url') as string;

// Startup state tracking
let isStartingUp = true;
let isAppReady = false;
let appReadyResolve: () => void;

// App readiness promise
export const appReady = new Promise<void>((resolve) => {
	appReadyResolve = () => {
		isAppReady = true;
		resolve();
	};
});

// Validate critical configuration
function validateConfig(): void {
	const required = ['app.port', 'database.host', 'database.name'];
	const missing = required.filter((key) => !cfg(key));

	if (missing.length > 0) {
		throw new Error(`Missing required config: ${missing.join(', ')}`);
	}

	// Port validation
	if (Number.isNaN(APP_PORT) || APP_PORT < 1 || APP_PORT > 65535) {
		throw new Error(`Invalid port: ${APP_PORT}. Must be 1-65535`);
	}
}

// Print startup banner
function printStartupInfo(): void {
	const width = 50;
	const lines = [
		['Environment:', APP_ENV],
		['Port:', APP_PORT.toString()],
		['URL:', `${APP_URL}:${APP_PORT}`],
		['Health:', `${APP_URL}:${APP_PORT}/health`],
	];

	console.log(`┌${'─'.repeat(width + 2)}┐`);
	console.log(`│ ${APP_NAME.padEnd(width)} │`);
	console.log(`├${'─'.repeat(width + 2)}┤`);

	for (const [label, value] of lines) {
		const text = `${label} ${value}`.padEnd(width);
		console.log(`│ ${text} │`);
	}

	console.log(`└${'─'.repeat(width + 2)}┘`);
}

// Graceful shutdown helpers
export async function closeHandler(): Promise<void> {
	const closeOperations = [
		{ name: 'Redis', fn: redisClose },
		{ name: 'Email queue close', fn: () => emailQueue.close() },
		{ name: 'Email queue disconnect', fn: () => emailQueue.disconnect() },
		{ name: 'Database', fn: destroyDatabase },
		{ name: 'Log streams', fn: () => new LogStream().closeFileStreams() },
	];

	await Promise.allSettled(
		closeOperations.map(async ({ name, fn }) => {
			try {
				await fn();
				systemLogger.debug(`${name} closed successfully`);
			} catch (error) {
				systemLogger.warn(error, `${name} close warning:`);
			}
		}),
	);
}

function shutdown(signal: string): void {
	systemLogger.debug(`${signal} received. Starting graceful shutdown...`);

	if (isStartingUp) {
		systemLogger.debug('Shutdown requested during startup');
		process.exit(1);
	}

	if (!server) {
		systemLogger.debug('No server instance to close');
		process.exit(0);
	}

	server.close(async () => {
		try {
			await closeHandler();
			systemLogger.debug('Server closed gracefully');
			process.exit(0);
		} catch (error) {
			systemLogger.fatal(error, 'Error during shutdown:');
			process.exit(1);
		}
	});

	setTimeout(() => {
		systemLogger.fatal(
			`Forcing shutdown after ${FORCE_SHUTDOWN_TIMEOUT}ms`,
		);
		process.exit(1);
	}, FORCE_SHUTDOWN_TIMEOUT).unref();
}

// ========== MIDDLEWARE SETUP ==========

// Helmet security headers (configured for API)
app.use(
	helmet({
		/**
		 * @security
		 * APIs don't render HTML.
		 * Content-Security-Policy adds overhead and provides no value for API endpoints.
		 * This is a deliberate, security-conscious decision for API-only applications.
		 */
		contentSecurityPolicy: false,

		/**
		 * Stop browsers from sniffing MIME types.
		 * Prevents some XSS attacks.
		 */
		noSniff: true,

		/**
		 * Prevent browser from sending cross-domain requests automatically.
		 * A must for secure APIs.
		 */
		referrerPolicy: { policy: 'no-referrer' },

		/**
		 * @security
		 * Not relevant for APIs, disable it.
		 * API endpoints are not embedded in iframes.
		 */
		frameguard: false,

		/**
		 * HSTS only in production.
		 * WARNING: Never enable in dev or localhost.
		 */
		hsts:
			process.env.NODE_ENV === 'production'
				? { maxAge: 31536000, includeSubDomains: true }
				: false,

		/**
		 * Hide "X-Powered-By: Express"
		 */
		hidePoweredBy: true,
	}),
);

// Trust proxy for correct client IP
app.set('trust proxy', true);

// CORS handling
app.use(corsHandler);

// Compression (skip for small responses)
app.use(
	compression({
		threshold: 1024,
		filter: (req: Request, res: Response): boolean => {
			const skip = req.get('x-no-compression');

			if (skip) {
				return false;
			}

			return compression.filter(req, res);
		},
	}),
);

// Request parsing
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((_req, res, next) => {
	res.locals.request_id = uuidv4();
	res.setHeader('X-Request-ID', res.locals.request_id);

	next();
});

// Request timeout
app.use((req, res, next) => {
	req.setTimeout(REQUEST_TIMEOUT, () => {
		systemLogger.warn(
			`Request timeout: ${req.method} ${req.url} (${res.locals.request_id})`,
		);
	});

	next();
});

// ========== ROUTES ==========

// Health
app.get('/health', (_req, res) => {
	res.status(200).json({
		status: 'OK',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// Ready
app.get('/ready', (_req, res) => {
	if (isAppReady) {
		res.status(200).json({ ready: true });
	} else {
		res.status(503).json({ ready: false }); // Service Unavailable
	}
});

// ========== APPLICATION INITIALIZATION ==========

async function initializeApp(): Promise<void> {
	try {
		validateConfig();

		// Initialize i18next before attaching middleware
		await initializeI18next();
		app.use(i18nextMiddleware(i18next));

		// Initialize database
		await initDatabase();

		// Middleware
		app.use(languageMiddleware); // Set `res.locals.lang`
		app.use(authMiddleware); // Set `res.locals.auth`
		app.use(requestContextMiddleware); // Prepare `requestContext`
		app.use(outputHandler); // Set `res.locals.output`

		// Routes
		const router = initRoutes();
		app.use('/', router);
		systemLogger.debug('Routes initialized');

		// Error handlers (must be last)
		app.use(notFoundHandler);
		app.use(errorHandler);

		// Start server (await listen)
		await new Promise<void>((resolve) => {
			server = app.listen(APP_PORT, () => {
				resolve();
			});
		});

		// Mark startup as complete
		isStartingUp = false;

		// Start background services (non-test env only)
		if (APP_ENV !== 'test') {
			// Email worker
			import('./workers/email.worker').catch((error) => {
				systemLogger.error(
					{ err: error },
					'Failed to start email worker',
				);
			});

			// Cron jobs
			startCronJobs();
		}

		// Mark app as ready
		appReadyResolve();

		// Print startup banner
		printStartupInfo();
	} catch (error) {
		systemLogger.fatal(error, 'Failed to initialize application');
		throw error;
	}
}

// ========== SIGNAL HANDLERS ==========

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
	systemLogger.fatal(error, 'Uncaught exception:');
	shutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, _promise) => {
	systemLogger.error(reason, 'Unhandled rejection');
});

// ========== START APPLICATION ==========

initializeApp().catch((error) => {
	systemLogger.fatal('Application startup failed:', error);
	process.exit(1);
});

export default app;

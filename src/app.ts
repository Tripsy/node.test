import 'reflect-metadata';
import express from 'express';
import {Server} from 'http';
import helmet from 'helmet';
import {corsHandler} from './middleware/cors-handler.middleware';
import cookieParser from 'cookie-parser';
import logger from './providers/logger.provider';
import {handle as i18nextMiddleware} from 'i18next-http-middleware';
import i18next from './config/i18n-setup.config';
import {outputHandler} from './middleware/output-handler.middleware';
import {notFoundHandler} from './middleware/not-found-handler.middleware';
import {errorHandler} from './middleware/error-handler.middleware';
import {destroyDatabase, initDatabase} from './providers/database.provider';
import {settings} from './config/settings.config';
import {initRoutes} from './config/init-routes.config';
import authMiddleware from './middleware/auth.middleware';
import languageMiddleware from './middleware/language.middleware';
import startCronJobs from './providers/cron.provider';
import {redisClose} from './config/init-redis.config';
import emailQueue from './queues/email.queue';

const app: express.Application = express();
export let server: Server;

// Helmet adds an extra layer of protection
app.use(helmet());

// This makes req.ip return the correct client IP instead of the proxy’s IP.
app.set('trust proxy', true);

// Middleware for handling CORS
app.use(corsHandler);

// Middleware for parsing cookies and JSON
app.use(cookieParser());
app.use(express.json());

// Middleware for handling language
app.use(languageMiddleware);

let appReadyResolve: () => void;

export const appReady = new Promise<void>((resolve) => {
    appReadyResolve = resolve;
});

async function initializeApp() {
    // Initialize the database
    await initDatabase();

    // Initialize i18next
    await i18next.init();

    // Language middleware
    app.use(i18nextMiddleware(i18next));

    // Authentication middleware
    app.use(authMiddleware);

    // Standardized response handler
    app.use(outputHandler);

    // Initialize routes
    const router = await initRoutes();

    // Add route handling middleware
    app.use('/', router);

    // Set up error handlers
    app.use(notFoundHandler); // 404 handler
    app.use(errorHandler); // Error handler

    // Start the server
    const port: number = settings.app.port;

    server = app.listen(port, () => {
        logger.info(`App listening on port ${port}`);
    });

    if (settings.app.env !== 'test') {
        // Start the worker here since it's database dependent
        import('./workers/email.worker').then(() => {
            logger.info('Email worker started.');
        });

        // Start cron jobs
        startCronJobs();
    }

    // Mark app as ready
    appReadyResolve();
}

export async function closeHandler(): Promise<void> {
    try {
        await redisClose();
        await emailQueue.close();
        await emailQueue.disconnect();

        await destroyDatabase();

        logger.debug('All resources closed.');
    } catch (error) {
        logger.error('Error occurred while closing resources', error);
    }
}

// Gracefully shut down the server on error or signal
const shutdown = (server: Server, signal: string): void => {
    logger.debug(`${signal} received. Closing server...`);

    if (server) {
        server.close(async () => {
            try {
                await closeHandler();

                logger.debug('Server closed gracefully');

                if (settings.app.env !== 'test') {
                    process.exit(0);
                }
            } catch (error: Error | any) {
                logger.fatal(error, error.message);

                if (settings.app.env !== 'test') {
                    process.exit(1);
                }
            }
        });
    } else {
        if (settings.app.env !== 'test') {
            process.exit(1);
        }
    }

    // Force shutdown if cleanup takes too long
    setTimeout(() => {
        logger.fatal('Forcing shutdown...');

        if (settings.app.env !== 'test') {
            process.exit(1);
        }

    }, 10000).unref();
};

initializeApp().catch((error) => {
    logger.fatal(error, error.message);
    shutdown(server, 'INIT_FAIL');
});

// Handle process signals
process.on('SIGINT', () => shutdown(server, 'SIGINT'));
process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
process.on('uncaughtException', (error) => {
    logger.fatal(error, 'Uncaught exception detected');
    shutdown(server, 'Uncaught Exception');
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error({reason, promise}, 'Unhandled rejection detected');
    shutdown(server, 'Unhandled Rejection');
});

export default app;

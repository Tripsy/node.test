import 'reflect-metadata';
import express from 'express';
import {Server} from 'http';
import helmet from 'helmet';
import {corsHandler} from './middleware/cors-handler.middleware';
import cookieParser from 'cookie-parser';
import i18n from './config/i18n-setup.config';
import logger from './services/logger.service';
import {outputHandler} from './middleware/output-handler.middleware';
import {notFoundHandler} from "./middleware/not-found-handler.middleware";
import {errorHandler} from './middleware/error-handler.middleware';
import {destroyDatabase, initDatabase} from './config/init-database.config';
import {settings} from './config/settings.config';
import {initRoutes} from './config/init-routes.config';
import {cacheService} from './services/cache.service';

const app: express.Application = express();
let server: Server;

// Helmet adds an extra layer of protection
app.use(helmet());

// Middleware for handling CORS
app.use(corsHandler);

// Middleware for parsing cookies and JSON
app.use(cookieParser());
app.use(express.json());

// Initialize i18n for localization
app.use(i18n.init);

// Add res.output object used to present standardized responses
app.use(outputHandler);

// Shutdown server
const shutdown = (server: Server, signal: string,): void => {
    logger.debug(`${signal} received. Closing server...`);

    if (server) {
        server.close(async () => {
            try {
                await destroyDatabase();
                await cacheService.disconnect()

                logger.debug('Server closed gracefully');
                process.exit(0);
            } catch (error) {
                logger.fatal(error, error.message);
                process.exit(1);
            }
        });
    } else {
        process.exit(1);
    }

    // Force shutdown if cleanup takes too long
    setTimeout(() => {
        logger.fatal('Forcing shutdown...');
        process.exit(1);
    }, 10000).unref();
};

// Initialize database and routes, set handlers (notFoundHandler and errorHandler) && start server
Promise.all([initDatabase(), initRoutes()])
    .then(([, router]) => {
        // Load routes
        app.use('/', router);

        // Handle 404 errors after all routes
        app.use(notFoundHandler);

        // Log errors and send error response
        app.use(errorHandler);

        const port: number = settings.app.port;

        server = app.listen(port, () => {
            logger.info(`App listening on port ${port}`);
        });
    })
    .catch((error) => {
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

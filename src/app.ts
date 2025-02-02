import 'reflect-metadata';
import express from 'express';
import {corsHandler} from './middleware/cors-handler.middleware';
import cookieParser from 'cookie-parser';
import i18n from './config/i18n-setup.config';
import logger from './services/logger.service';
import {outputHandler} from './middleware/output-handler.middleware';
import {notFoundHandler} from "./middleware/not-found-handler.middleware";
import {errorHandler} from './middleware/error-handler.middleware';
import {initializeDatabase, destroyDatabase} from './services/database.service';
import {settings} from './config/settings.config';
import {initRoutesService} from "./services/init-routes.service";

const app: express.Application = express();

// Middleware for handling CORS
app.use(corsHandler);

// Middleware for parsing cookies and JSON
app.use(cookieParser());
app.use(express.json());

// Initialize i18n for localization
app.use(i18n.init);

// Add res.output object used to present standardized responses
app.use(outputHandler);

// Initialize database and start server
initializeDatabase()
    .then(() => {
        logger.info('Database initialized successfully');

        // Initialize and load routes
        return initRoutesService()
            .then((router) => {
                app.use('/', router);

                // Handle 404 errors after all routes
                app.use(notFoundHandler);

                // Log errors and send error response
                app.use(errorHandler);

                const port: number = settings.app.port;

                const server = app.listen(port, () => {
                    logger.info(`App listening on port ${port}`);
                });

                const shutdown = async (signal: string) => {
                    logger.info(`${signal} received. Closing server...`);

                    server.close(async () => {
                        logger.info('Server closed gracefully');

                        try {
                            await destroyDatabase(); // Close the database connection
                            logger.info('Database connection closed');

                            setTimeout(() => process.exit(0), 500);
                        } catch (error) {
                            logger.error(error, 'Error closing database:');

                            setTimeout(() => process.exit(1), 500);
                        }
                    });

                    setTimeout(() => {
                        logger.fatal('Forcing shutdown...');
                        process.exit(1); // Force exit if the server doesn't close in time
                    }, 5000).unref();
                };

                process.on('SIGINT', () => shutdown('SIGINT').catch((error) => logger.error(error, 'Shutdown error')));
                process.on('SIGTERM', () => shutdown('SIGTERM').catch((error) => logger.error(error, 'Shutdown error')));
                process.on('uncaughtException', (error) => {
                    logger.fatal(error, 'Uncaught exception detected');
                    shutdown('Uncaught Exception').catch((error) => logger.error(error, 'Shutdown error'));
                });
                process.on('unhandledRejection', (reason, promise) => {
                    logger.error({ reason, promise }, 'Unhandled rejection detected');
                    shutdown('Unhandled Rejection').catch((error) => logger.error(error, 'Shutdown error'));
                });
            })
            .catch((error) => {
                logger.error(error, 'Failed to initialize routes:');
                process.exit(1); // Exit the application if initialization fails
            });
    })
    .catch((error) => {
        logger.error(error, 'Failed to initialize database:');
        process.exit(1); // Exit the application if initialization fails
    });

import 'reflect-metadata';
import {initializeDatabase, destroyDatabase} from './services/database.service';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import i18n from './config/i18n-setup';
import apiRoutes from './routes/api';
import {notFoundHandler, errorHandler, corsHandler} from './helpers/handler';
import logger from './services/logger.service';

const app: express.Application = express();

app.use(corsHandler);

// Middleware for parsing cookies and JSON
app.use(cookieParser());
app.use(express.json());

// Initialize i18n for localization
app.use(i18n.init);

// Load routes
app.use('/', apiRoutes);

// Not found handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize database and start server
initializeDatabase()
    .then(() => {
        logger.info('Database initialized successfully');

        const port: number = parseInt(process.env.APP_PORT || '3000', 10);

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
                } catch (err) {
                    logger.error('Error closing database:', err);

                    setTimeout(() => process.exit(1), 500);
                }
            });

            setTimeout(() => {
                logger.fatal('Forcing shutdown...');
                process.exit(1); // Force exit if the server doesn't close in time
            }, 5000).unref();
        };

        process.on('SIGINT', () => shutdown('SIGINT').catch((err) => logger.error('Shutdown error:', err)));
        process.on('SIGTERM', () => shutdown('SIGTERM').catch((err) => logger.error('Shutdown error:', err)));
        process.on('uncaughtException', (err) => {
            logger.fatal(err, 'Uncaught exception detected');
            shutdown('Uncaught Exception').catch((err) => logger.error('Shutdown error:', err));
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error({reason, promise}, 'Unhandled rejection detected');
            shutdown('Unhandled Rejection').catch((err) => logger.error('Shutdown error:', err));
        });
    })
    .catch((error) => {
        logger.error('Failed to initialize database:', error);
        process.exit(1); // Exit the application if initialization fails
    });

export default app

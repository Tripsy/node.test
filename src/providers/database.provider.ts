import dataSource from '../config/data-source.config';
import logger, {systemLogger} from './logger.provider';

export const initDatabase = async () => {
    try {
        await dataSource.initialize();

        systemLogger.debug('Database connection initialized successfully');
    } catch (error) {
        logger.error('Error while initializing database connection', error);

        throw error;
    }
};

export const destroyDatabase = async () => {
    if (dataSource) {
        try {
            await dataSource.destroy();

            systemLogger.debug('Database connection closed gracefully');
        } catch (error) {
            logger.error('Error closing database connection', error);

            throw error;
        }
    }
};
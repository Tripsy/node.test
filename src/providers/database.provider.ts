import dataSource from '@/config/data-source.config';
import { getSystemLogger } from '@/providers/logger.provider';

export const initDatabase = async () => {
	try {
		await dataSource.initialize();

		getSystemLogger().debug('Database connection initialized successfully');
	} catch (error) {
		getSystemLogger().error(
			{ err: error },
			'Error while initializing database connection',
		);

		throw error;
	}
};

export const destroyDatabase = async () => {
	try {
		await dataSource.destroy();

		getSystemLogger().debug('Database connection closed gracefully');
	} catch (error) {
		getSystemLogger().error(error, 'Error closing database connection');

		throw error;
	}
};

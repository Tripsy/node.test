import { getDataSource } from '@/config/data-source.config';
import { getSystemLogger } from '@/lib/providers/logger.provider';

export const initDatabase = async () => {
	try {
		await getDataSource().initialize();

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
		await getDataSource().destroy();

		getSystemLogger().debug('Database connection closed gracefully');
	} catch (error) {
		getSystemLogger().error(
			{ err: error },
			'Error closing database connection',
		);

		throw error;
	}
};

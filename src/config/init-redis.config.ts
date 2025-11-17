import Redis from 'ioredis';
import { systemLogger } from '../providers/logger.provider';
import { cfg } from './settings.config';

let redisInstance: Redis | null = null;

export const getRedisClient = (): Redis => {
	if (!redisInstance) {
		redisInstance = new Redis({
			host: cfg('redis.host') as string,
			port: cfg('redis.port') as number,
			password: cfg('redis.password') as string,
		});

		redisInstance.on('error', (error) => {
			systemLogger.error({ err: error }, 'Redis connection error');
		});

		redisInstance.on('connect', () => {
			systemLogger.debug('Connected to Redis');
		});
	}

	return redisInstance;
};

export const redisClose = async (): Promise<void> => {
	if (redisInstance) {
		try {
			await redisInstance.quit();
			systemLogger.debug('Redis connection closed gracefully');
		} catch (error) {
			systemLogger.error(
				{ err: error },
				'Error closing Redis connection',
			);

			throw error;
		} finally {
			redisInstance = null;
		}
	}
};

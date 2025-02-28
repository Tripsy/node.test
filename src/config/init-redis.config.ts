import Redis from 'ioredis';
import {settings} from './settings.config';
import {systemLogger} from '../providers/logger.provider';

const redisConfig: any = {
    host: settings.redis.host,
    port: settings.redis.port,
};

// Set password only if provided
if (settings.redis.password) {
    redisConfig.password = settings.redis.password;
}

// Create a single Redis instance
const redisClient = new Redis(redisConfig);

// Handle Redis connection events
redisClient.on('error', (err) => {
    systemLogger.error(err, 'Redis connection error');
});

redisClient.on('connect', () => {
    systemLogger.debug('Connected to Redis');
});

/**
 * Gracefully disconnect the Redis client.
 */
export async function closeRedis(): Promise<void> {
    try {
        await redisClient.quit();
        systemLogger.info('Redis client disconnected gracefully');
    } catch (error) {
        systemLogger.error('Error disconnecting Redis client:', error);
    }
}

export default redisClient;

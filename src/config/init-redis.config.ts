import Redis from 'ioredis';
import {cfg} from './settings.config';
import {systemLogger} from '../providers/logger.provider';

class RedisClient {
    private static instance: Redis;

    public static getInstance(): Redis {
        if (!RedisClient.instance) {
            RedisClient.instance = new Redis({
                host: cfg('redis.host'),
                port: cfg('redis.port'),
                password: cfg('redis.password'),
            });

            RedisClient.instance.on('error', (error) => {
                systemLogger.error('Redis connection error', error);
            });

            RedisClient.instance.on('connect', () => {
                systemLogger.debug('Connected to Redis');
            });
        }

        return RedisClient.instance;
    }

    public static async close(): Promise<void> {
        if (RedisClient.instance) {
            try {
                await RedisClient.instance.quit();

                systemLogger.debug('Redis connection closed gracefully');
            } catch (error) {
                systemLogger.error('Error closing Redis connection', error);

                throw error;
            }
        }
    }
}

export const getRedisClient = (): Redis => RedisClient.getInstance();
export const redisClose = RedisClient.close;

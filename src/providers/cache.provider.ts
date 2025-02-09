import Redis from 'ioredis';
import {settings} from '../config/settings.config';
import {childLogger} from '../helpers/log';
import logger from './logger.provider';

const systemLogger = childLogger(logger, 'system');

class CacheProvider {
    private redisInstance: Redis | null = null;
    public isCached: boolean = false;

    private get redis(): Redis {
        if (!this.redisInstance) {
            const redisConfig: any = {
                host: settings.redis.host,
                port: settings.redis.port,
            };

            // Only set password if it's provided
            if (settings.redis.password) {
                redisConfig.password = settings.redis.password;
            }

            this.redisInstance = new Redis(redisConfig);

            // Handle Redis connection errors
            this.redisInstance.on('error', (err) => {
                systemLogger.error(err, 'Redis connection error');
            });

            this.redisInstance.on('connect', () => {
                systemLogger.debug('Connected to Redis');
            });
        }

        return this.redisInstance;
    }

    buildKey(...args: string[]) {
        return args.join(':');
    }

    determineTtl(ttl?: number): number {
        return ttl === undefined ? settings.cache.ttl : ttl;
    }

    formatInputData(data: Exclude<any, null>): any {
        if (typeof data === 'number' || typeof data === 'string' || typeof data === 'boolean') {
            return data;
        }

        return JSON.stringify(data);
    }

    formatOutputData(data: any): any {
        if (data === null || typeof data !== 'string') {
            return data;
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            return data;
        }
    }

    async get<T>(key: string, fetchFunction: () => Promise<T>, ttl?: number): Promise<T> {
        try {
            ttl = this.determineTtl(ttl);

            if (ttl === 0) {
                return await fetchFunction();
            }

            const cachedData = await this.redis.get(key);

            if (cachedData) {
                this.isCached = true;
                return this.formatOutputData(cachedData) as T;
            }

            const freshData = await fetchFunction();
            await this.set(key, freshData, ttl);

            return freshData;
        } catch (error) {
            systemLogger.error(error, `Error fetching cache for key: ${key}`);
            return await fetchFunction(); // Fallback to fetching fresh data
        }
    }

    async set(key: string, data: any, ttl?: number) {
        try {
            if (data !== null) {
                await this.redis.set(key, this.formatInputData(data), 'EX', this.determineTtl(ttl));
            }
        } catch (error) {
            systemLogger.error(error, `Error setting cache for key: ${key}`);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            systemLogger.error(error, `Error deleting cache for key: ${key}`);
        }
    }

    /**
     * Delete multiple cache entries by pattern.
     * @param pattern - The pattern to match cache keys.
     *
     * ex: pattern = user:* > user:1, user:2
     */
    async deleteByPattern(pattern: string): Promise<void> {
        try {
            let cursor = '0';

            do {
                // Scan for matching keys in small batches
                const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;

                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            } while (cursor !== '0'); // Continue until all keys are scanned
        } catch (error) {
            systemLogger.error(error, `Error deleting cache with pattern: ${pattern}`);
        }
    }

    /**
     * Gracefully disconnect the Redis client.
     */
    async disconnect(): Promise<void> {
        try {
            await this.redis.quit();
            systemLogger.info('Redis client disconnected gracefully');
        } catch (error) {
            systemLogger.error('Error disconnecting Redis client:', error);
        }
    }
}

export const cacheProvider = new CacheProvider();

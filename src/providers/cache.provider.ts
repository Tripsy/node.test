import {settings} from '../config/settings.config';
import {systemLogger} from './logger.provider';
import {redisClient} from '../config/init-redis.config';
import Redis from 'ioredis';

class CacheProvider {
    private static instance: CacheProvider;

    public isCached: boolean = false;

    private constructor() {}

    public static getInstance(): CacheProvider {
        if (!CacheProvider.instance) {
            CacheProvider.instance = new CacheProvider();
        }

        return CacheProvider.instance;
    }

    private get cache(): Redis {
        return redisClient;
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

    async exists(key: string): Promise<boolean> {
        try {
            const exists = await this.cache.exists(key);
            return exists === 1; // Redis returns 1 if key exists, 0 otherwise
        } catch (error) {
            systemLogger.error(error, `Error checking existence for key: ${key}`);
            return false;
        }
    }

    async get<T>(key: string, fetchFunction: () => Promise<T>, ttl?: number): Promise<T> {
        try {
            ttl = this.determineTtl(ttl);

            if (ttl === 0) {
                return await fetchFunction();
            }

            const cachedData = await this.cache.get(key);

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
                await this.cache.set(key, this.formatInputData(data), 'EX', this.determineTtl(ttl));
            }
        } catch (error) {
            systemLogger.error(error, `Error setting cache for key: ${key}`);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.cache.del(key);
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
                const [nextCursor, keys] = await this.cache.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;

                if (keys.length > 0) {
                    const pipeline = this.cache.pipeline();
                    keys.forEach((key) => pipeline.del(key));
                    await pipeline.exec();
                }
            } while (cursor !== '0'); // Continue until all keys are scanned
        } catch (error) {
            systemLogger.error(error, `Error deleting cache with pattern: ${pattern}`);
        }
    }
}

export const cacheProvider = CacheProvider.getInstance();

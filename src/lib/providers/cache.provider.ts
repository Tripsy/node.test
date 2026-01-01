import type Redis from 'ioredis';
import { getRedisClient } from '@/config/init-redis.config';
import { cfg } from '@/config/settings.config';
import { getSystemLogger } from '@/lib/providers/logger.provider';

type CacheData = unknown;

export class CacheProvider {
	public isCached: boolean = false;

	constructor(private readonly cache: Redis) {}

	buildKey(...args: string[]) {
		return args.join(':');
	}

	determineTtl(ttl?: number): number {
		return ttl === undefined ? (cfg('cache.ttl') as number) : ttl;
	}

	formatInputData(data: CacheData): string | number {
		if (typeof data === 'number') {
			return data;
		}

		if (typeof data === 'boolean') {
			return data ? 'true' : 'false';
		}

		if (typeof data === 'string') {
			return data;
		}

		try {
			return JSON.stringify(data);
		} catch {
			return String(data);
		}
	}

	formatOutputData(data: CacheData): CacheData {
		if (data === null || typeof data !== 'string') {
			return data;
		}

		try {
			// Only parse if it looks like JSON (starts with {, [, ", or digit)
			const trimmed = data.trim();

			if (
				trimmed.startsWith('{') ||
				trimmed.startsWith('[') ||
				trimmed.startsWith('"')
			) {
				return JSON.parse(data);
			}

			return data;
		} catch {
			// Return as-is if not valid JSON
			return data;
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			const exists = await this.cache.exists(key);
			return exists === 1; // Redis returns 1 if key exists, 0 otherwise
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error checking existence for key: ${key}`,
			);
			return false;
		}
	}

	async get(
		key: string,
		fetchFunction: () => Promise<CacheData>,
		ttl?: number,
	): Promise<CacheData> {
		try {
			ttl = this.determineTtl(ttl);

			if (ttl === 0) {
				return await fetchFunction();
			}

			const cachedData = await this.cache.get(key);

			if (cachedData) {
				this.isCached = true;

				return this.formatOutputData(cachedData);
			}

			const freshData = await fetchFunction();
			await this.set(key, freshData, ttl);

			return freshData;
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error fetching cache for key: ${key}`,
			);

			return await fetchFunction(); // Fallback to fetching fresh data
		}
	}

	async set(key: string, data: CacheData, ttl?: number) {
		try {
			if (data !== null) {
				await this.cache.set(
					key,
					this.formatInputData(data),
					'EX',
					this.determineTtl(ttl),
				);
			}
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error setting cache for key: ${key}`,
			);
		}
	}

	async delete(key: string): Promise<void> {
		try {
			await this.cache.del(key);
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error deleting cache for key: ${key}`,
			);
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
				const [nextCursor, keys] = await this.cache.scan(
					cursor,
					'MATCH',
					pattern,
					'COUNT',
					100,
				);
				cursor = nextCursor;

				if (keys.length > 0) {
					const pipeline = this.cache.pipeline();

					keys.forEach((key) => {
						pipeline.del(key);
					});

					await pipeline.exec();
				}
			} while (cursor !== '0'); // Continue until all keys are scanned
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error deleting cache with pattern: ${pattern}`,
			);
		}
	}
}

const redis = getRedisClient();
export const cacheProvider = new CacheProvider(redis);

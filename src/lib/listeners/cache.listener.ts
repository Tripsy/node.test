import {
	type CacheCleanEventPayload,
	eventEmitter,
} from '@/config/event.config';
import { getCacheProvider } from '@/lib/providers/cache.provider';

export function registerCacheListener() {
	eventEmitter.on('cacheClean', async (payload: CacheCleanEventPayload) => {
		const cacheProvider = getCacheProvider();

		void cacheProvider.deleteByPattern(
			`${cacheProvider.buildKey(...payload.cacheKeyArgs)}*`,
		);
	});
}

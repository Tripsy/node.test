import {
	type CacheCleanEventPayload,
	eventEmitter,
} from '@/config/event.config';
import { cacheProvider } from '@/lib/providers/cache.provider';

export function registerCacheListener() {
	eventEmitter.on('cacheClean', async (payload: CacheCleanEventPayload) => {
		void cacheProvider.deleteByPattern(
			`${cacheProvider.buildKey(...payload.cacheKeyArgs)}*`,
		);
	});
}

import {
	type CacheCleanEventPayload,
	eventEmitter,
} from '@/config/event.config';
import { cacheProvider } from '@/providers/cache.provider';

export default function registerCacheListener() {
	eventEmitter.on('cacheClean', async (payload: CacheCleanEventPayload) => {
		void cacheProvider.deleteByPattern(
			`${cacheProvider.buildKey(...payload.cacheKeyArgs)}*`,
		);
	});
}

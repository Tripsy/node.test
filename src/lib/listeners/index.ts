import { registerCacheListener } from '@/lib/listeners/cache.listener';
import { registerLogHistoryListener } from '@/lib/listeners/log-history.listener';

export function registerEventListeners() {
	registerLogHistoryListener();
	registerCacheListener();
}

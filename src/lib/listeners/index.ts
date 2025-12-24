import { registerLogHistoryListener } from '@/lib/listeners/log-history.listener';

export function registerEventListeners() {
	registerLogHistoryListener();
}

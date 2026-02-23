import { EventEmitter } from 'node:events';
import type { LogHistoryAction } from '@/shared/types/log-history.type';

export type LogHistoryEventPayload = {
	entity: string;
	entity_ids: number[];
	action: LogHistoryAction;
	data?: Record<string, string | number>;
};

export type CacheCleanEventPayload = {
	cacheKeyArgs: string[];
};

type Events = {
	history: LogHistoryEventPayload;
	cacheClean: CacheCleanEventPayload;
};

class TypedEmitter extends EventEmitter {
	on<K extends keyof Events>(
		event: K,
		listener: (payload: Events[K]) => void,
	) {
		return super.on(event, listener);
	}

	emit<K extends keyof Events>(event: K, payload: Events[K]) {
		return super.emit(event, payload);
	}
}

export const eventEmitter = new TypedEmitter();

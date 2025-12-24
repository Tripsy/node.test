import { EventEmitter } from 'node:events';
import type { LogHistoryEventPayload } from '@/features/log-history/log-history.entity';

type Events = {
	history: LogHistoryEventPayload;
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

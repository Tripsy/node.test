import { Queue } from 'bullmq';
import { getRedisClient } from '@/config/init-redis.config';
import { Configuration } from '@/config/settings.config';
import { getSystemLogger } from '@/providers/logger.provider';

type QueueInstances = Map<string, Queue>;

const instances: QueueInstances = new Map();

export const queueFactory = {
	getQueue(name: string): Queue | null {
		if (Configuration.isEnvironment('test')) {
			return null;
		}

		let queue = instances.get(name);

		if (!queue) {
			queue = new Queue(name, {
				connection: getRedisClient(),
			});

			instances.set(name, queue);

			getSystemLogger().debug(`${name} queue ready`);
		}

		return queue;
	},

	async closeAll(): Promise<void> {
		const closePromises = Array.from(instances.values()).map((queue) =>
			queue.close(),
		);

		await Promise.allSettled(closePromises);

		instances.clear();
	},
};

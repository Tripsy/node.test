import { getSystemLogger } from '@/providers/logger.provider';

export async function initQueues(): Promise<void> {
	try {
		await import('@/queues/email.queue');
	} catch (error) {
		getSystemLogger().error({ err: error }, 'Failed to initialize queues');
	}
}

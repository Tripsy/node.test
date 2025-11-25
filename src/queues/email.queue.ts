import { Queue } from 'bullmq';
import { getRedisClient } from '@/config/init-redis.config';
import logger from "@/providers/logger.provider";

const emailQueue = new Queue('emailQueue', {
	connection: getRedisClient(),
});

export default emailQueue;

// Debug
// async function checkQueueStatus() {
//     const waiting = await emailQueue.getWaiting();
//     const active = await emailQueue.getActive();
//     const completed = await emailQueue.getCompleted();
//     const failed = await emailQueue.getFailed();
//
//     logger.info({
//         waiting: waiting.length,
//         active: active.length,
//         completed: completed.length,
//         failed: failed.length,
//     },'Queue status');
// }
//
// setInterval(checkQueueStatus, 30000);

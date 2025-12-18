import { Worker } from 'bullmq';
import { cfg } from '@/config/settings.config';
import { MailQueueStatusEnum } from '@/features/mail-queue/mail-queue.entity';
import { getMailQueueRepository } from '@/features/mail-queue/mail-queue.repository';
import { type EmailQueueData, sendEmail } from '@/providers/email.provider';
import { getSystemLogger } from '@/providers/logger.provider';

const emailWorker = new Worker(
	'emailQueue',
	async (job) => {
		const { mailQueueId, emailContent, to, from } =
			job.data as EmailQueueData;

		try {
			getSystemLogger().info(
				`Processing email job ${job.id} for mailQueueId: ${mailQueueId}`,
			);

			await sendEmail(emailContent, to, from);

			await getMailQueueRepository().update(mailQueueId, {
				status: MailQueueStatusEnum.SENT,
				error: null,
				sent_at: new Date(),
			});

			getSystemLogger().info(
				`Successfully processed email job ${job.id}`,
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			getSystemLogger().error(
				`Failed to process email job ${job.id}: ${errorMessage}`,
			);

			await getMailQueueRepository().update(mailQueueId, {
				status: MailQueueStatusEnum.ERROR,
				error: errorMessage,
				sent_at: new Date(),
			});
		}
	},
	{
		connection: {
			host: cfg('redis.host') as string,
			port: cfg('redis.port') as number,
		},
		concurrency: 5,
	},
);

// Error handler for worker-level errors (Redis connection issues, etc.)
emailWorker.on('error', (err: Error) => {
	getSystemLogger().error(
		{
			err: {
				message: err.message,
				stack: err.stack,
				name: err.name,
			},
		},
		'Email worker error',
	);
});

// Graceful shutdown
const shutdown = async () => {
	getSystemLogger().warn('Shutting down emailQueue worker...');

	try {
		await emailWorker.close();

		getSystemLogger().info('Worker closed successfully');

		process.exit(0);
	} catch (error) {
		getSystemLogger().error({ err: error }, `Error during worker shutdown`);

		process.exit(1);
	}
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Add event listeners for worker status
emailWorker.on('ready', () => {
	getSystemLogger().debug('Email worker is ready and listening for jobs');
});

// emailWorker.on('active', (job) => {
//     getSystemLogger().info(`Job ${job.id} is now active`);
// });
//
// emailWorker.on('completed', (job) => {
//     getSystemLogger().info(`Job ${job.id} completed successfully`);
// });
//
// emailWorker.on('failed', (job, err) => {
//     getSystemLogger().error(err, `Job ${job?.id || 'n/a'} failed with error:`);
// });

export default emailWorker;

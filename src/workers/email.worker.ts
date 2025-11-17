import { Worker } from 'bullmq';
import { cfg } from '../config/settings.config';
import { MailQueueStatusEnum } from '../enums/mail-queue-status.enum';
import {
	type EmailQueueData,
	sendEmail,
	systemFrom,
} from '../providers/email.provider';
import logger from '../providers/logger.provider';
import MailQueueRepository from '../repositories/mail-queue.repository';

const emailWorker = new Worker(
	'emailQueue',
	async (job) => {
		const { mailQueueId, emailContent, to, from } =
			job.data as EmailQueueData;

		try {
			logger.info(
				`Processing email job ${job.id} for mailQueueId: ${mailQueueId}`,
			);

			await sendEmail(emailContent, to, from ?? systemFrom);

			await MailQueueRepository.update(mailQueueId, {
				status: MailQueueStatusEnum.SENT,
				error: null,
				sent_at: new Date(),
			});

			logger.info(`Successfully processed email job ${job.id}`);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			logger.error(
				`Failed to process email job ${job.id}: ${errorMessage}`,
			);

			await MailQueueRepository.update(mailQueueId, {
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
	logger.error(
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
	logger.warn('Shutting down emailQueue worker...');

	try {
		await emailWorker.close();

		logger.info('Worker closed successfully');

		process.exit(0);
	} catch (error) {
		logger.error({ err: error }, `Error during worker shutdown`);

		process.exit(1);
	}
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('Email worker started and ready to process jobs');

export default emailWorker;

import {Worker} from 'bullmq';
import {settings} from '../config/settings.config';
import {EmailQueueData, sendEmail, systemFrom} from '../providers/email.provider';
import MailQueueRepository from '../repositories/mail-queue.repository';
import {MailQueueStatusEnum} from '../enums/mail-queue-status.enum';

const emailWorker = new Worker(
    'emailQueue',
    async (job) => {
        const {mailQueueId, emailContent, to, from} = job.data as EmailQueueData;

        try {
            await sendEmail(emailContent, to, from ?? systemFrom);

            // Update `mail_queue` table
            await MailQueueRepository.update(mailQueueId, {
                status: MailQueueStatusEnum.SENT,
                error: null,
                sent_at: new Date(),
            });
        } catch (error) {
            // Update `mail_queue` table
            await MailQueueRepository.update(mailQueueId, {
                status: MailQueueStatusEnum.ERROR,
                error: error instanceof Error ? error.message : 'Unknown error',
                sent_at: new Date(),
            });

            throw error;
        }
    },
    {
        connection: {
            host: settings.redis.host,
            port: settings.redis.port,
        }, // Redis connection
        concurrency: 5, // Process up to 5 jobs concurrently
    }
);

// Use it only worker runs on a separate process
//
// logger.debug('emailQueue worker started.');
//
// const shutdown = async () => {
//     logger.warn('Shutting down emailQueue worker...');
//     await emailWorker.close();
//     process.exit(0);
// };
//
// process.on('SIGTERM', shutdown);
// process.on('SIGINT', shutdown);

export default emailWorker;
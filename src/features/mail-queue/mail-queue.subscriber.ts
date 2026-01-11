import type Mail from 'nodemailer/lib/mailer';
import { EventSubscriber, type InsertEvent } from 'typeorm';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import {
	type EmailQueueData,
	prepareEmailContent,
} from '@/providers/email.provider';
import emailQueue from '@/queues/email.queue';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class MailQueueSubscriber extends SubscriberAbstract<MailQueueEntity> {
	protected readonly Entity = MailQueueEntity;

	async afterInsert(event: InsertEvent<MailQueueEntity>) {
		const emailQueueData: EmailQueueData = {
			mailQueueId: event.entity.id,
			emailContent: prepareEmailContent({
				language: event.entity.language,
				content: event.entity.content,
			}),
			to: event.entity.to as Mail.Address,
			from: event.entity.from as Mail.Address | null,
		};

		// Add email to the queue
		await emailQueue.add('email:queue', emailQueueData, {
			removeOnComplete: true, // Automatically remove completed jobs
			attempts: 3, // Retry failed emails up to 3 times
			backoff: {
				type: 'exponential',
				delay: 5000,
			}, // Retry with increasing delays
		});
	}
}

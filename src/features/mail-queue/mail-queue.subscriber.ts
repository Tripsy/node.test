import { EventSubscriber, type InsertEvent } from 'typeorm';
import { Configuration } from '@/config/settings.config';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import {
	type EmailQueueData,
	prepareEmailContent,
} from '@/providers/email.provider';
import getEmailQueue from '@/queues/email.queue';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';
import type { EmailAddressType } from '@/shared/types/email.type';

@EventSubscriber()
export class MailQueueSubscriber extends SubscriberAbstract<MailQueueEntity> {
	protected readonly Entity = MailQueueEntity;

	async afterInsert(event: InsertEvent<MailQueueEntity>) {
		// Skip in test environment
		if (Configuration.isEnvironment('test')) {
			return;
		}

		const emailQueueData: EmailQueueData = {
			mailQueueId: event.entity.id,
			emailContent: prepareEmailContent({
				language: event.entity.language,
				content: event.entity.content,
			}),
			to: event.entity.to as EmailAddressType,
			from: event.entity.from as EmailAddressType | undefined,
		};

		// Add email to the queue
		await getEmailQueue()?.add('email:queue', emailQueueData, {
			removeOnComplete: true, // Automatically remove completed jobs
			attempts: 3, // Retry failed emails up to 3 times
			backoff: {
				type: 'exponential',
				delay: 5000,
			}, // Retry with increasing delays
		});
	}
}

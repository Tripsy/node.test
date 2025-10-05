import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent
} from 'typeorm';
import MailQueueEntity from '../entities/mail-queue.entity';
import emailQueue from '../queues/email.queue';
import {EmailQueueData, prepareEmailContent} from '../providers/email.provider';
import Mail from 'nodemailer/lib/mailer';

@EventSubscriber()
export class MailQueueSubscriber implements EntitySubscriberInterface<MailQueueEntity> {
    /**
     * Specify which entity this subscriber is for.
     */
    listenTo() {
        return MailQueueEntity;
    }

    async afterInsert(event: InsertEvent<MailQueueEntity>) {
        const emailQueueData: EmailQueueData = {
            mailQueueId: event.entity.id,
            emailContent: prepareEmailContent({
                language: event.entity.language,
                content: event.entity.content
            }),
            to: event.entity.to as Mail.Address,
            from: event.entity.from as Mail.Address | null
        };

        // Add email to queue
        await emailQueue.add('email:queue', emailQueueData, {
            removeOnComplete: true, // Automatically remove completed jobs
            attempts: 3, // Retry failed emails up to 3 times
            backoff: {
                type: 'exponential',
                delay: 5000
            } // Retry with increasing delays
        });
    }
}

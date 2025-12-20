import nodemailer, { type Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { lang } from '@/config/i18n.setup';
import templates from '@/config/nunjucks.config';
import { cfg } from '@/config/settings.config';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import { getMailQueueRepository } from '@/features/mail-queue/mail-queue.repository';
import { TemplateTypeEnum } from '@/features/template/template.entity';
import { getTemplateRepository } from '@/features/template/template.repository';
import { getErrorMessage } from '@/lib/helpers';
import { getSystemLogger } from '@/lib/providers/logger.provider';
import type { EmailContent, EmailTemplate } from '@/lib/types/template.type';

let emailTransporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

export function getEmailTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
	if (!emailTransporter) {
		emailTransporter = nodemailer.createTransport({
			host: cfg('mail.host') as string,
			port: cfg('mail.port') as number,
			secure: cfg('mail.encryption') === 'ssl',
			auth: {
				user: cfg('mail.username') as string,
				pass: cfg('mail.password') as string,
			},
		} as SMTPTransport.Options);
	}

	return emailTransporter;
}

export type EmailQueueData = {
	mailQueueId: number;
	emailContent: EmailContent;
	to: Mail.Address;
	from: Mail.Address | null;
};

export async function loadEmailTemplate(
	label: string,
	language: string,
): Promise<EmailTemplate> {
	const template = await getTemplateRepository()
		.createQuery()
		.select(['id', 'language', 'type', 'content'])
		.filterBy('label', label)
		.filterBy('language', language)
		.filterBy('type', TemplateTypeEnum.EMAIL)
		.first();

	if (!template) {
		throw new Error(
			lang('template.error.cannot_load', {
				label,
				language,
				type: TemplateTypeEnum.EMAIL,
			}),
		);
	}

	return {
		id: template.id,
		language: template.language,
		content: {
			subject: template.content.subject,
			text: template.content.text || undefined,
			html: template.content.html,
			layout: template.content.layout || undefined,
		} as EmailContent,
	};
}

export function prepareEmailContent(template: EmailTemplate): EmailContent {
	try {
		const emailSubject = templates.renderString(
			template.content.subject,
			template.content.vars || {},
		);
		const emailContent = templates.renderString(
			template.content.html,
			template.content.vars || {},
		);

		return {
			subject: emailSubject,
			// text: emailContent.text ? templates.renderString(emailContent.text, vars) : undefined,
			html: template.content.layout
				? templates.render(`emails/${template.content.layout}.html`, {
						language: template.language,
						emailSubject: emailSubject,
						emailContent: emailContent,
					})
				: emailContent,
		};
	} catch (error: unknown) {
		getSystemLogger().fatal(error, getErrorMessage(error));

		throw new Error('Template render error');
	}
}

export async function queueEmail(
	template: EmailTemplate,
	to: Mail.Address,
	from?: Mail.Address,
): Promise<void> {
	const mailQueueEntity = new MailQueueEntity();
	mailQueueEntity.template_id = template.id;
	mailQueueEntity.language = template.language;
	mailQueueEntity.content = template.content;
	mailQueueEntity.to = to;
	mailQueueEntity.from = from;

	await getMailQueueRepository().save(mailQueueEntity);
}

export async function sendEmail(
	content: EmailContent,
	to: Mail.Address,
	from: Mail.Address | null,
): Promise<void> {
	try {
		// Fallback to default `from` address
		if (!from) {
			from = {
				name: cfg('mail.fromName') as string,
				address: cfg('mail.fromAddress') as string,
			};
		}

		await getEmailTransporter().sendMail({
			to: to,
			from: from,
			subject: content.subject,
			text: content.text,
			html: content.html,
		});

		getSystemLogger().debug(
			lang('shared.debug.email_sent', {
				subject: content.subject,
				to: to.address,
			}),
		);
	} catch (error: unknown) {
		getSystemLogger().error(
			error,
			lang('shared.debug.email_error', {
				subject: content.subject,
				to: to.address,
				error: getErrorMessage(error),
			}),
		);

		throw error;
	}
}

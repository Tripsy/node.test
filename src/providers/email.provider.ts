import nodemailer, { type Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { lang } from '../config/i18n-setup.config';
import templates from '../config/nunjucks.config';
import { cfg } from '../config/settings.config';
import MailQueueEntity from '../features/mail-queue/mail-queue.entity';
import MailQueueRepository from '../features/mail-queue/mail-queue.repository';
import TemplateRepository from '../features/template/template.repository';
import { TemplateTypeEnum } from '../features/template/template-type.enum';
import { getErrorMessage } from '../helpers/system.helper';
import type { EmailContent, EmailTemplate } from '../types/template.type';
import { systemLogger } from './logger.provider';

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

export const systemFrom: Mail.Address = {
	name: cfg('mail.fromName') as string,
	address: cfg('mail.fromAddress') as string,
};

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
	const template = await TemplateRepository.createQuery()
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
		systemLogger.fatal(error, getErrorMessage(error));

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

	await MailQueueRepository.save(mailQueueEntity);
}

export async function sendEmail(
	content: EmailContent,
	to: Mail.Address,
	from: Mail.Address,
): Promise<void> {
	try {
		await getEmailTransporter().sendMail({
			to: to,
			from: from,
			subject: content.subject,
			text: content.text,
			html: content.html,
		});

		systemLogger.debug(
			lang('debug.email_sent', {
				subject: content.subject,
				to: to.address,
			}),
		);
	} catch (error: unknown) {
		systemLogger.error(
			error,
			lang('debug.email_error', {
				subject: content.subject,
				to: to.address,
				error: getErrorMessage(error),
			}),
		);

		throw error;
	}
}

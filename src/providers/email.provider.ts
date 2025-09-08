import Mail from 'nodemailer/lib/mailer';
import {cfg} from '../config/settings.config';
import  {systemLogger} from './logger.provider';
import {lang} from '../config/i18n-setup.config';
import nodemailer, {Transporter} from 'nodemailer';
import TemplateRepository from '../repositories/template.repository';
import {TemplateTypeEnum} from '../enums/template-type.enum';
import {EmailContent, EmailTemplate} from '../types/template.type';
import MailQueueEntity from '../entities/mail-queue.entity';
import MailQueueRepository from '../repositories/mail-queue.repository';
import templates from '../config/nunjucks.config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import {getErrorMessage} from '../helpers/system.helper';

let emailTransporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

export function getEmailTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
    if (!emailTransporter) {
        emailTransporter = nodemailer.createTransport({
            host: cfg("mail.host"),
            port: parseInt(cfg("mail.port")),
            secure: cfg("mail.encryption") === 'ssl',
            auth: {
                user: cfg("mail.username"),
                pass: cfg("mail.password"),
            },
        } as SMTPTransport.Options);
    }

    return emailTransporter;
}

export const systemFrom: Mail.Address = {
    name: cfg('mail.fromName'),
    address: cfg('mail.fromAddress')
};

export type EmailQueueData = {
    mailQueueId: number;
    emailContent: EmailContent;
    to: Mail.Address;
    from: Mail.Address | null;
}

export async function loadEmailTemplate(label: string, language: string): Promise<EmailTemplate> {
    const template = await TemplateRepository.createQuery()
        .select(['id', 'language', 'type', 'content'])
        .filterBy('label', label)
        .filterBy('language', language)
        .filterBy('type', TemplateTypeEnum.EMAIL)
        .first();

    if (!template) {
        throw new Error(lang('template.error.cannot_load', {
            label,
            language,
            type: TemplateTypeEnum.EMAIL
        }));
    }

    return {
        id: template.id,
        language: template.language,
        content: {
            subject: template.content.subject,
            text: template.content.text || undefined,
            html: template.content.html,
            layout: template.content.layout || undefined,
        },
    };
}

export function prepareEmailContent(template: EmailTemplate): EmailContent {
    try {
        const emailSubject = templates.renderString(template.content.subject, template.vars || {});
        const emailContent = templates.renderString(template.content.html, template.vars || {});

        return {
            subject: emailSubject,
            // text: emailContent.text ? templates.renderString(emailContent.text, vars) : undefined,
            html: template.content.layout ? templates.render('emails/' + template.content.layout + '.html', {
                language: template.language,
                emailSubject: emailSubject,
                emailContent: emailContent
            }) : emailContent
        };
    } catch (error: unknown) {
        systemLogger.fatal(error, getErrorMessage(error));

        throw new Error('Template render error');
    }
}

export async function queueEmail(
    template: EmailTemplate,
    to: Mail.Address,
    from?: Mail.Address
): Promise<void> {
    const mailQueueEntity = new MailQueueEntity();
    mailQueueEntity.template_id = template.id;
    mailQueueEntity.language = template.language;
    mailQueueEntity.content = template.content;
    mailQueueEntity.to = to;
    mailQueueEntity.from = from;

    await MailQueueRepository.save(mailQueueEntity);
}

export async function sendEmail(content: EmailContent, to: Mail.Address, from: Mail.Address): Promise<void> {
    try {
        await getEmailTransporter().sendMail({
            to: to,
            from: from,
            subject: content.subject,
            text: content.text,
            html: content.html
        });

        systemLogger.debug(lang('debug.email_sent', {
            subject: content.subject,
            to: to.address
        }));
    } catch (error: unknown) {
        systemLogger.error(error, lang('debug.email_error', {
            subject: content.subject,
            to: to.address,
            error: getErrorMessage(error)
        }));

        throw error;
    }
}
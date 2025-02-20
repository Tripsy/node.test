import Mail from 'nodemailer/lib/mailer';
import {settings} from '../config/settings.config';
import {replaceTemplateVars} from '../helpers/utils';
import logger from './logger.provider';
import {lang} from '../config/i18n-setup.config';
import nodemailer, {Transporter} from 'nodemailer';
import {siteLink} from '../helpers/link';
import TemplateRepository from '../repositories/template.repository';
import {TemplateTypeEnum} from '../enums/template-type.enum';
import {EmailContent, EmailTemplate} from '../types/template.type';
import MailQueueEntity from '../entities/mail-queue.entity';
import MailQueueRepository from '../repositories/mail-queue.repository';

let emailTransporter: Transporter | null = null;

export function getEmailTransporter(): Transporter {
    if (!emailTransporter) {
        emailTransporter = nodemailer.createTransport({
            host: settings.mail.host,
            port: settings.mail.port,
            auth: {
                user: settings.mail.username,
                pass: settings.mail.password
            }
        });
    }

    return emailTransporter;
}

export const systemFrom: Mail.Address = {
    name: settings.mail.fromName,
    address: settings.mail.fromAddress
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
        throw new Error(lang('error.template.not_found', {
            label,
            language,
            type: TemplateTypeEnum.EMAIL
        }));
    }

    return {
        templateId: template.id,
        language: template.language,
        emailContent: {
            subject: template.content.subject,
            text: template.content.text,
            html:  template.content.html
        }
    };
}

export function prepareEmailContent(emailContent: EmailContent, vars: Record<string, string> = {}): EmailContent {
    vars.currentYear = new Date().getFullYear().toString();
    vars.siteLink = siteLink();

    return {
        subject: replaceTemplateVars(emailContent.subject, vars),
        text: emailContent.text ? replaceTemplateVars(emailContent.text, vars) : undefined,
        html: replaceTemplateVars(emailContent.html, vars)
    };
}

export async function queueEmail(
    template: EmailTemplate,
    vars: Record<string, string> = {},
    to: Mail.Address,
    from?: Mail.Address
): Promise<void> {
    const mailQueueEntity = new MailQueueEntity();
    mailQueueEntity.template_id = template.templateId;
    mailQueueEntity.language = template.language;
    mailQueueEntity.content = template.emailContent;
    mailQueueEntity.vars = vars;
    mailQueueEntity.to = to;
    mailQueueEntity.from = from;

    await MailQueueRepository.save(mailQueueEntity);
}

export async function sendEmail(emailContent: EmailContent, to: Mail.Address, from: Mail.Address): Promise<void> {
    getEmailTransporter()
        .sendMail({
            to: to,
            from: from,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html
        })
        .then(() => {
            logger.debug(lang('debug.email_sent', {
                subject: emailContent.subject,
                to: to.address
            }));
        })
        .catch((error) => {
            logger.error(error, lang('debug.email_error', {
                subject: emailContent.subject,
                to: to.address,
                error: error.message
            }));
        });
}
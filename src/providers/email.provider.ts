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
import {TemplateVars} from '../types/template-vars.type';

let emailTransporter: Transporter | null = null;

export function getEmailTransporter(): Transporter {
    if (!emailTransporter) {
        emailTransporter = nodemailer.createTransport({
            host: cfg('mail.host'),
            port: cfg('mail.port'),
            secure: cfg('mail.encryption') === 'ssl',
            auth: {
                user: cfg('mail.username'),
                pass: cfg('mail.password')
            }
        });
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
        templateId: template.id,
        language: template.language,
        emailContent: {
            subject: template.content.subject,
            text: template.content.text || undefined,
            html: template.content.html,
            layout: template.content.layout || undefined,
        },
    };
}

export function prepareEmailContent(language: string, content: EmailContent, vars: TemplateVars = {}): EmailContent {
    try {
        const emailSubject = templates.renderString(content.subject, vars);
        const emailContent = templates.renderString(content.html, vars);

        return {
            subject: emailSubject,
            // text: emailContent.text ? templates.renderString(emailContent.text, vars) : undefined,
            html: content.layout ? templates.render('emails/' + content.layout + '.html', {
                language: language,
                emailSubject: emailSubject,
                emailContent: emailContent
            }) : emailContent
        };
    } catch (error: Error | any) {
        systemLogger.fatal(error, error.message);

        throw new Error('Template render error');
    }
}

export async function queueEmail(
    template: EmailTemplate,
    vars: TemplateVars = {},
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
            systemLogger.debug(lang('debug.email_sent', {
                subject: emailContent.subject,
                to: to.address
            }));
        })
        .catch((error) => {
            systemLogger.error(error, lang('debug.email_error', {
                subject: emailContent.subject,
                to: to.address,
                error: error.message
            }));
        });
}
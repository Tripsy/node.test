import Mail from 'nodemailer/lib/mailer';
import {settings} from '../config/settings.config';
import {EmailContent} from '../types/email-content.type';
import {replaceTemplateVars} from '../helpers/utils';
import logger from './logger.provider';
import {lang} from '../config/i18n-setup.config';
import nodemailer, {Transporter} from 'nodemailer';

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

const systemFrom: Mail.Address = {
    name: settings.mail.fromName,
    address: settings.mail.fromAddress
};

export function prepareEmailContent(templateLabel: string, lang: string, templateVars: Record<string, string> = {}): EmailContent {
    const emailContent = {
        subject: `Recover password`,
        text: '',
        html: "Hello ${name}. Your recover ident is ${ident} which will expire at ${expire_at}. Mail sent in ${currentYear}"
    };

    templateVars.currentYear = new Date().getFullYear().toString();

    return {
        subject: replaceTemplateVars(emailContent.subject, templateVars),
        text: replaceTemplateVars(emailContent.text, templateVars),
        html: replaceTemplateVars(emailContent.html, templateVars)
    };
}

export function queueEmail(emailContent: EmailContent, to: Mail.Address, from?: Mail.Address): void {
    getEmailTransporter()
        .sendMail({
            to: to,
            from: from ?? systemFrom,
            subject: emailContent.subject,
            text: emailContent.text ,
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
import {settings} from '../../config/settings.config';
import build from 'pino-abstract-transport';
import { prettyFactory } from 'pino-pretty';
import nodemailer from 'nodemailer';
import i18n from '../../config/i18n-setup.config';

export default async function (options = {}) {
    const emailTransporter = nodemailer.createTransport({
        host: settings.mail.host,
        port: settings.mail.port,
        secure: true,
        auth: {
            user: settings.mail.username,
            pass: settings.mail.password,
        },
    });

    return build(
        async (source) => {
            const pretty = prettyFactory({
                colorize: false
            });

            for await (let line of source) {
                try {
                    await emailTransporter.sendMail({
                        from: settings.mail.fromAddress,
                        to: settings.pino.logEmail,
                        subject: i18n.__('email.subject.pino-transport-email', {
                            source: settings.app.name
                        }),
                        text: i18n.__('email.content.pino-transport-email', {
                            content: pretty(line)
                        })
                    });
                } catch (error) {
                    console.error('Failed to send email:', error);
                }
            }
        },
        {
            parse: 'lines',
        }
    );
}

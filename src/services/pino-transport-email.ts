import 'dotenv/config';
import build from 'pino-abstract-transport';
import { prettyFactory } from 'pino-pretty';
import nodemailer from 'nodemailer';
import i18n from '../config/i18n-setup';

export default async function (options = {}) {
    const emailTransporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT as string, 10),
        secure: true,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
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
                        from: process.env.MAIL_FROM_ADDRESS,
                        to: process.env.PINO_LOG_EMAIL,
                        subject: i18n.__('email.subject.pino-transport-email', {
                            source: process.env.APP_NAME
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
            async close() {
                console.log('Transport closed.');
            },
        }
    );
}

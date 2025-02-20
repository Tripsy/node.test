import {settings} from '../../config/settings.config';
import build from 'pino-abstract-transport';
import { prettyFactory } from 'pino-pretty';
import nodemailer from 'nodemailer';
import {lang} from '../../config/i18n-setup.config';

//	"email": {
//		"subject": {
//			"pino-transport-email": "Logging Alert - {{ source }}"
//		},
//		"content": {
//			"pino-transport-email": "Your app has logged an alert:\n\n {{message}}."
//		}
//	},


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
                        subject: lang('email.subject.pino-transport-email', {
                            source: settings.app.name
                        }),
                        text: lang('email.content.pino-transport-email', {
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

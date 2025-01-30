import 'dotenv/config'
import build from 'pino-abstract-transport'
import {prettyFactory} from 'pino-pretty'
import nodemailer from 'nodemailer'
import i18n from '../config/i18n-setup'

export default async function (
    options = {}
) {
    const emailTransporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: true,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    })

    const tasks = []

    return build(
        async (source) => {
            const pretty = prettyFactory({
                colorize: false
            })

            for await (let line of source) {
                const task = emailTransporter
                    .sendMail({
                        from: process.env.MAIL_FROM_ADDRESS,
                        to: process.env.PINO_LOG_EMAIL,
                        subject: i18n.__('email.subject.pino-transport-email', {
                            source: process.env.APP_NAME
                        }),
                        text: i18n.__('email.content.pino-transport-email', {
                            content: pretty(line)
                        })
                    })

                tasks.push(task)
            }
        },
        {
            parse: 'lines',
            async close() {
                await Promise.all(tasks)
            },
        }
    )
}

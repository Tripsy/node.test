import {MailtrapTransport} from 'mailtrap'
import nodemailer, {Transporter} from 'nodemailer';
import {settings} from '../config/settings.config';

const emailTransporter: Transporter = nodemailer.createTransport(MailtrapTransport({
    token: settings.mail.mailtrapToken,
}));

export default emailTransporter;





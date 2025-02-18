import {settings} from '../config/settings.config';

export function siteLink(): string {
    return settings.app.url;
}

export function emailConfirmLink(token: string): string {
    return `${settings.app.url}/account/email-confirm/${token}`;
}

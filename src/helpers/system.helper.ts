import {settings} from '../config/settings.config';
import path from 'path';
import {Request} from 'express';
import {isValidIp} from './utils.helper';

function buildPath(...args: string[]): string {
    return path.join(...args);
}

export function buildRootPath(...args: string[]): string {
    return buildPath(settings.app.rootPath, ...args);
}

export function buildSrcPath(...args: string[]): string {
    return buildPath(settings.app.srcPath, ...args);
}

export function apiDocumentationUrl(...args: string[]): string {
    return `${settings.app.url}/api-docs/${args.join('/')}`;
}

export function getClientIp(req: Request): string {
    const reqXForwardedFor = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim().replace(/^::ffff:/, '');

    if (isValidIp(reqXForwardedFor)) {
        return reqXForwardedFor;
    }

    const reqIp = req.ip?.replace(/^::ffff:/, '') || '';

    if (isValidIp(reqIp)) {
        return reqIp;
    }

    return 'n/a';
}
